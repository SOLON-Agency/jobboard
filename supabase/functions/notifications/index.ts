/**
 * notifications — Supabase Edge Function (v2 dispatcher)
 *
 * Single entry point for all notifications. Accepts a typed event, a list of
 * recipient user IDs, and a data payload. Per-recipient preferences are read
 * from `profiles.notifications_email/sms/browser` (channel-on flags) and
 * `profiles.notification_preferences` (per-type per-channel overrides).
 *
 * For every recipient the dispatcher:
 *   1. Loads channel-on flags and per-type prefs.
 *   2. Renders the correct template for each enabled channel.
 *   3. Calls send-email / send-browser / send-sms sub-functions.
 *   4. Always inserts one row into public.notifications for the in-app bell.
 *
 * Legacy direct-address mode (to_email + body/resend_template) is preserved
 * for unclaimed-companies-nudge and similar external-recipient scenarios.
 *
 * Auth: user JWT or SUPABASE_SERVICE_ROLE_KEY (same as before).
 *
 * New request body:
 *   type             string           — NotificationTypeKey (required for typed mode)
 *   recipients       string[]         — user_ids (required for typed mode)
 *   data             object           — template variables
 *   channels?        string[]         — override which channels to use
 *   idempotency_key? string
 *
 * Legacy request body (still accepted):
 *   recipient        string           — single user_id
 *   to_email         string           — direct email (service-role only)
 *   to_name          string
 *   channel          "email"|"sms"
 *   body             string           — HTML body
 *   subject          string
 *   idempotency_key? string
 *
 * Required secrets: SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_FROM,
 *                   NEXT_PUBLIC_SITE_URL, VAPID_PRIVATE_KEY, VAPID_SUBJECT,
 *                   NEXT_PUBLIC_VAPID_PUBLIC_KEY
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { sendResendEmail, isResendConfigured } from "../_shared/resend.ts";
import { buildEmail } from "../_shared/email-templates.ts";
import {
  NOTIFICATION_DEFAULTS,
  isChannelEnabled,
  type NotificationChannel,
  type NotificationTypeKey,
} from "../_shared/notification-types.ts";
import { getTemplate } from "../_shared/templates/index.ts";

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function isServiceRoleToken(token: string): boolean {
  const srk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  return !!(srk && token === srk);
}

async function isAuthorised(authHeader: string | null): Promise<boolean> {
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (isServiceRoleToken(token)) return true;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return !!user?.id;
}

// ─── Profile preference loader ────────────────────────────────────────────────

interface ProfilePrefs {
  email: boolean;
  sms: boolean;
  browser: boolean;
  // deno-lint-ignore no-explicit-any
  notification_preferences: Record<string, Record<string, boolean>>;
  email_address: string | null;
}

// deno-lint-ignore no-explicit-any
async function loadProfilePrefs(adminClient: any, userId: string): Promise<ProfilePrefs> {
  const { data } = await adminClient
    .from("profiles")
    .select("notifications_email, notifications_sms, notifications_browser, notification_preferences")
    .eq("id", userId)
    .maybeSingle();

  // deno-lint-ignore no-explicit-any
  const p = (data ?? {}) as any;

  let emailAddress: string | null = null;
  try {
    const { data: { user } } = await adminClient.auth.admin.getUserById(userId);
    emailAddress = user?.email ?? null;
  } catch {
    // fail-open: address will be null, email channel will be skipped
  }

  return {
    email: p.notifications_email !== false,
    sms: p.notifications_sms === true,
    browser: p.notifications_browser === true,
    notification_preferences: (p.notification_preferences as Record<string, Record<string, boolean>>) ?? {},
    email_address: emailAddress,
  };
}

// ─── Sub-function invokers ────────────────────────────────────────────────────

const supabaseUrl = () => Deno.env.get("SUPABASE_URL")!;
const serviceKey = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function callSendEmail(to: string, subject: string, html: string, idempotencyKey?: string): Promise<void> {
  if (!isResendConfigured()) {
    console.warn("notifications: Resend not configured — skipping email.");
    return;
  }
  await sendResendEmail({ to, subject, html, idempotencyKey });
}

async function callSendBrowser(userId: string, title: string, body: string, url?: string): Promise<void> {
  const res = await fetch(`${supabaseUrl()}/functions/v1/send-browser`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: userId, title, body, url }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn(`notifications: send-browser responded ${res.status}: ${text}`);
  }
}

async function callSendSms(userId: string, message: string, phone?: string): Promise<void> {
  if (!phone) return;
  const res = await fetch(`${supabaseUrl()}/functions/v1/send-sms`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: userId, phone, message }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn(`notifications: send-sms responded ${res.status}: ${text}`);
  }
}

// ─── In-app feed insert ───────────────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
async function insertFeedRow(adminClient: any, userId: string, title: string, body: string | null, type: string, data: Record<string, unknown>): Promise<void> {
  const { error } = await adminClient.from("notifications").insert({
    user_id: userId,
    title,
    body,
    type,
    data,
  });
  if (error) {
    console.warn(`notifications: feed insert failed for ${userId}: ${error.message}`);
  }
}

// ─── Typed dispatch for a single recipient ────────────────────────────────────

async function dispatchToRecipient(
  // deno-lint-ignore no-explicit-any
  adminClient: any,
  siteUrl: string,
  type: NotificationTypeKey,
  userId: string,
  // deno-lint-ignore no-explicit-any
  data: Record<string, any>,
  channelOverride?: NotificationChannel[],
  idempotencyKey?: string
): Promise<void> {
  const prefs = await loadProfilePrefs(adminClient, userId);
  const tpl = getTemplate(type);
  if (!tpl) {
    console.warn(`notifications: no template found for type "${type}"`);
    return;
  }

  const dataWithSite = { ...data, site_url: siteUrl };

  const activeChannels: NotificationChannel[] = channelOverride
    ? channelOverride
    : (["email", "browser", "sms"] as NotificationChannel[]).filter((ch) => {
        const channelOn = ch === "email" ? prefs.email : ch === "sms" ? prefs.sms : prefs.browser;
        return channelOn && isChannelEnabled(prefs.notification_preferences, type, ch);
      });

  // Email
  if (activeChannels.includes("email") && prefs.email_address) {
    try {
      const { subject, html } = tpl.buildEmail(dataWithSite);
      await callSendEmail(
        prefs.email_address,
        subject,
        html,
        idempotencyKey ? `${idempotencyKey}/${userId}/email` : undefined
      );
    } catch (e) {
      console.warn(`notifications: email failed for ${userId}:`, e);
    }
  }

  // Browser push
  if (activeChannels.includes("browser")) {
    try {
      const shortText = tpl.buildShort(dataWithSite);
      const inApp = tpl.buildInApp(dataWithSite);
      await callSendBrowser(userId, inApp.title, shortText, (data.job_url ?? data.company_url ?? siteUrl) as string);
    } catch (e) {
      console.warn(`notifications: browser push failed for ${userId}:`, e);
    }
  }

  // SMS
  if (activeChannels.includes("sms")) {
    try {
      // deno-lint-ignore no-explicit-any
      const phone = (data.phone as string | undefined) ?? (await (async () => {
        const { data: pd } = await adminClient.from("profiles").select("phone").eq("id", userId).maybeSingle();
        // deno-lint-ignore no-explicit-any
        return (pd as any)?.phone as string | undefined;
      })());
      if (phone) {
        const shortText = tpl.buildShort(dataWithSite);
        await callSendSms(userId, shortText, phone);
      }
    } catch (e) {
      console.warn(`notifications: sms failed for ${userId}:`, e);
    }
  }

  // Always insert feed row
  const inApp = tpl.buildInApp(dataWithSite);
  await insertFeedRow(adminClient, userId, inApp.title, inApp.body, type, { ...inApp.data, _channels_sent: activeChannels });
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

  const authHeader = req.headers.get("Authorization");
  if (!(await isAuthorised(authHeader))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // deno-lint-ignore no-explicit-any
  let payload: Record<string, any>;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const siteUrl = (Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000").replace(/\/$/, "");
  const adminClient = createClient(supabaseUrl(), serviceKey(), { auth: { persistSession: false } });

  // ── Typed mode (new API) ──────────────────────────────────────────────────
  if (typeof payload.type === "string") {
    const type = payload.type as NotificationTypeKey;
    const recipients: string[] = Array.isArray(payload.recipients)
      ? (payload.recipients as string[]).filter((r) => typeof r === "string")
      : typeof payload.recipient === "string" ? [payload.recipient] : [];

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: "recipients array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // deno-lint-ignore no-explicit-any
    const data = (typeof payload.data === "object" && payload.data !== null ? payload.data : {}) as Record<string, any>;
    const channelOverride = Array.isArray(payload.channels)
      ? (payload.channels as NotificationChannel[])
      : undefined;
    const idempotencyKey = typeof payload.idempotency_key === "string" ? payload.idempotency_key : undefined;

    const results = await Promise.allSettled(
      recipients.map((uid) =>
        dispatchToRecipient(adminClient, siteUrl, type, uid, data, channelOverride, idempotencyKey)
      )
    );

    const errors = results.filter((r) => r.status === "rejected").map((r) =>
      r.status === "rejected" ? String(r.reason) : ""
    );

    return new Response(
      JSON.stringify({ ok: true, sent: recipients.length - errors.length, total: recipients.length, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Legacy direct-address mode (to_email + body) — preserved for unclaimed-nudge ──
  const { to_email, to_name, body, subject, idempotency_key } = payload;
  const channel: string = payload.channel ?? "email";

  if (!to_email && !payload.recipient) {
    return new Response(JSON.stringify({ error: "recipient, recipients, or to_email is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // to_email is only accepted from service-role callers.
  if (to_email && !isServiceRoleToken((authHeader ?? "").replace(/^Bearer\s+/i, ""))) {
    return new Response(
      JSON.stringify({ error: "to_email is only allowed for service-role callers" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (channel === "sms") {
    return new Response(JSON.stringify({ error: "SMS via legacy mode not supported; use typed mode" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Legacy recipient (single user_id, email only)
  if (payload.recipient && !to_email) {
    const prefs = await loadProfilePrefs(adminClient, payload.recipient as string);
    if (!prefs.email) {
      return new Response(JSON.stringify({ ok: true, sent: false, skipped: "email notifications disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!prefs.email_address) {
      return new Response(JSON.stringify({ ok: false, error: "could not resolve email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isResendConfigured()) {
      return new Response(JSON.stringify({ ok: true, sent: false, skipped: "Resend not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    try {
      const html = typeof body === "string" && body.trim()
        ? body
        : buildEmail({ heading: subject ?? "LegalJobs", bodyHtml: "", siteUrl });
      await callSendEmail(prefs.email_address, subject ?? "LegalJobs", html, idempotency_key);
      return new Response(JSON.stringify({ ok: true, sent: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: String(err) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // Direct-address branch
  if (!isResendConfigured()) {
    return new Response(JSON.stringify({ ok: true, sent: false, skipped: "Resend not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const siteName = Deno.env.get("SITE_NAME") ?? "LegalJobs";
    const html = typeof body === "string" && body.trim()
      ? body
      : buildEmail({ heading: subject ?? siteName, bodyHtml: to_name ? `<p>${to_name}</p>` : "", siteUrl });
    await callSendEmail(to_email, subject ?? siteName, html, idempotency_key);
    return new Response(JSON.stringify({ ok: true, sent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notifications legacy direct-address error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
