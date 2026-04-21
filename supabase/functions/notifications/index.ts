/**
 * notifications — Supabase Edge Function
 *
 * Sends a persistent notification to a user through the requested channel.
 * Respects the per-user notification preference stored in `profiles`.
 *
 * Can be called from:
 *   • React client code  — via supabase.functions.invoke() (user JWT auto-attached)
 *   • Another edge function — pass Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 *
 * Required Supabase secrets:
 *   RESEND_API_KEY        — Resend API key
 *   RESEND_FROM           — verified sender address
 *   NEXT_PUBLIC_SITE_URL  — canonical site origin (used in email footer)
 *
 * Request body (JSON):
 *   recipient  string   (required) — user ID of the notification recipient
 *   channel    string   (required) — "email" | "sms"  (default: "email")
 *   body       string   (optional*) — HTML body when not using a Resend template
 *   subject    string   (optional) — email subject (defaults to site name; overrides template default when set)
 *   resend_template  object (optional*) — { id: string, variables: Record<string, string|number> }
 *   idempotency_key  string (optional) — forwarded to Resend
 *
 * *Either `body` (non-empty) or `resend_template` with a valid `id` is required for email.
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import {
  sendResendEmail,
  sendResendTemplateEmail,
  isResendConfigured,
} from "../_shared/resend.ts";
import { buildEmail } from "../_shared/email-templates.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationChannel = "email" | "sms";

interface ResendTemplatePayload {
  id: string;
  variables: Record<string, string | number>;
}

interface NotificationPayload {
  recipient: string;
  channel?: NotificationChannel;
  body?: string;
  subject?: string;
  resend_template?: ResendTemplatePayload;
  idempotency_key?: string;
}

interface NotificationResult {
  ok: boolean;
  sent: boolean;
  skipped?: string;
  error?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Validates the caller's credentials.
 * Accepts:
 *   1. A Supabase user JWT  (client call)
 *   2. The service role key (edge-function-to-edge-function call)
 *
 * Returns true when the caller is authorised to send notifications.
 */
async function isAuthorised(authHeader: string | null): Promise<boolean> {
  if (!authHeader) return false;

  const token = authHeader.replace(/^Bearer\s+/i, "");

  // Service-role shortcut — trusted internal call from another edge function.
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRoleKey && token === serviceRoleKey) return true;

  // Otherwise validate as a regular user JWT.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return !!user?.id;
}

// ─── Preference check ─────────────────────────────────────────────────────────

/**
 * Uses the admin (service-role) client to read the recipient's notification
 * preference. Falls back to `true` (opt-in) if the row is missing.
 */
async function hasNotificationsEnabled(
  // deno-lint-ignore no-explicit-any
  adminClient: any,
  recipientId: string,
  channel: NotificationChannel
): Promise<boolean> {
  const column =
    channel === "sms" ? "notifications_sms" : "notifications_email";

  const { data, error } = await adminClient
    .from("profiles")
    .select(column)
    .eq("id", recipientId)
    .maybeSingle();

  if (error) {
    console.warn(`notifications: preference check failed — ${error.message}`);
    return true; // fail-open so we don't silently drop notifications
  }
  if (!data) return true; // profile not yet created — default opt-in

  return data[column] !== false;
}

// ─── Channel handlers ─────────────────────────────────────────────────────────

async function sendEmailNotification(
  // deno-lint-ignore no-explicit-any
  adminClient: any,
  recipientId: string,
  subject: string,
  siteName: string,
  siteUrl: string,
  options:
    | { mode: "html"; body: string }
    | {
        mode: "template";
        template: ResendTemplatePayload;
        subjectOverride?: string;
      },
  idempotencyKey?: string
): Promise<void> {
  // Resolve the recipient's email via the admin auth API (not accessible via RLS).
  const {
    data: { user },
    error,
  } = await adminClient.auth.admin.getUserById(recipientId);

  if (error || !user?.email) {
    throw new Error(
      `notifications: could not resolve email for user ${recipientId}: ${error?.message ?? "no email"}`
    );
  }

  const resolvedIdempotency =
    idempotencyKey?.trim() ||
    `notification/${recipientId}/${Date.now()}`;

  if (options.mode === "template") {
    await sendResendTemplateEmail({
      to: user.email,
      subject: options.subjectOverride?.trim(),
      template: {
        id: options.template.id,
        variables: options.template.variables,
      },
      idempotencyKey: resolvedIdempotency,
    });
    return;
  }

  const html = buildEmail({
    heading: subject,
    bodyHtml: `<p>${options.body}</p>`,
    siteUrl,
    siteName,
  });

  await sendResendEmail({
    to: user.email,
    subject,
    html,
    idempotencyKey: resolvedIdempotency,
  });
}

async function sendSmsNotification(
  _recipientId: string,
  _body: string
): Promise<void> {
  // SMS provider is TBD. Throw so the caller knows the channel is unavailable.
  throw new Error("SMS notifications are not yet implemented.");
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  const authorised = await isAuthorised(authHeader);
  if (!authorised) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let payload: NotificationPayload;
  try {
    payload = (await req.json()) as NotificationPayload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { recipient, body, subject, resend_template, idempotency_key } = payload;
  const channel: NotificationChannel = payload.channel ?? "email";

  if (!recipient || typeof recipient !== "string") {
    return new Response(JSON.stringify({ error: "recipient is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const hasTemplate =
    resend_template &&
    typeof resend_template === "object" &&
    typeof resend_template.id === "string" &&
    resend_template.id.trim() !== "" &&
    resend_template.variables !== null &&
    typeof resend_template.variables === "object";

  const hasBody = typeof body === "string" && body.trim() !== "";

  if (!hasTemplate && !hasBody) {
    return new Response(
      JSON.stringify({
        error:
          'Either non-empty "body" or "resend_template" with id and variables is required',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (hasTemplate && resend_template) {
    if (
      resend_template.variables === null ||
      typeof resend_template.variables !== "object" ||
      Array.isArray(resend_template.variables)
    ) {
      return new Response(
        JSON.stringify({ error: "resend_template.variables must be an object" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  if (channel !== "email" && channel !== "sms") {
    return new Response(
      JSON.stringify({ error: 'channel must be "email" or "sms"' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Config ────────────────────────────────────────────────────────────────
  const siteName = Deno.env.get("SITE_NAME") ?? "LegalJobs";
  const siteUrl = (
    Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  const resolvedSubject = subject?.trim() || siteName;

  // ── Admin client (for preference check + email lookup) ────────────────────
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  // ── Preference check ──────────────────────────────────────────────────────
  const enabled = await hasNotificationsEnabled(adminClient, recipient, channel);
  if (!enabled) {
    const result: NotificationResult = {
      ok: true,
      sent: false,
      skipped: `User has ${channel} notifications disabled.`,
    };
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  try {
    if (channel === "email") {
      if (!isResendConfigured()) {
        console.warn("notifications: Resend not configured — skipping email.");
        const result: NotificationResult = {
          ok: true,
          sent: false,
          skipped: "RESEND_API_KEY / RESEND_FROM not configured.",
        };
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (hasTemplate && resend_template) {
        await sendEmailNotification(
          adminClient,
          recipient,
          resolvedSubject,
          siteName,
          siteUrl,
          {
            mode: "template",
            template: resend_template,
            subjectOverride: subject?.trim() || undefined,
          },
          idempotency_key
        );
      } else {
        await sendEmailNotification(
          adminClient,
          recipient,
          resolvedSubject,
          siteName,
          siteUrl,
          { mode: "html", body: body ?? "" },
          idempotency_key
        );
      }
    } else {
      await sendSmsNotification(recipient, body);
    }
  } catch (err) {
    console.error("notifications error:", err);
    const result: NotificationResult = {
      ok: false,
      sent: false,
      error: String(err),
    };
    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const result: NotificationResult = { ok: true, sent: true };
  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
