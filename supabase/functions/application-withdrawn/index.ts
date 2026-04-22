/**
 * application-withdrawn — Supabase Edge Function
 *
 * Invoked when a candidate withdraws (closes) their own application. Updates
 * made by the applicant (status='withdrawn', withdraw_reason, withdrawn_at)
 * are persisted by the client beforehand; this function's sole responsibility
 * is to notify the job poster via the `notifications` Edge Function.
 *
 * The poster's user id is resolved through the SECURITY DEFINER RPC
 * `application_notification_recipient`, which is only callable by an
 * applicant with a matching row in `public.applications`.
 *
 * Required secrets: same as `notifications` (SUPABASE_SERVICE_ROLE_KEY,
 * RESEND_API_KEY, RESEND_FROM, NEXT_PUBLIC_SITE_URL).
 *
 * Body: { application_id: string, reason: string }
 * Auth: Supabase user JWT (the applicant).
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import {
  buildEmail,
  detailRow,
  infoTable,
} from "../_shared/email-templates.ts";

async function invokeNotifications(
  serviceKey: string,
  supabaseUrl: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; sent?: boolean; skipped?: string; error?: string }> {
  const res = await fetch(`${supabaseUrl}/functions/v1/notifications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    /* non-JSON response */
  }

  const out = parsed as {
    ok?: boolean;
    sent?: boolean;
    skipped?: string;
    error?: string;
  };
  if (!res.ok) {
    return { ok: false, error: out.error || text || res.statusText };
  }
  if (out.ok === false) {
    return { ok: false, error: out.error || text || "notifications failed" };
  }
  return {
    ok: true,
    sent: out.sent === true,
    skipped: out.skipped,
    error: out.error,
  };
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatReasonHtml(reason: string): string {
  return escapeHtml(reason).replace(/\n/g, "<br/>");
}

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
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey?.trim()) {
    return new Response(
      JSON.stringify({
        error: "Server misconfigured: SUPABASE_SERVICE_ROLE_KEY missing",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error: authErr,
  } = await userClient.auth.getUser();

  if (authErr || !user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let applicationId = "";
  let reason = "";
  try {
    const json = (await req.json()) as {
      application_id?: string;
      reason?: string;
    };
    applicationId =
      typeof json.application_id === "string" ? json.application_id.trim() : "";
    reason = typeof json.reason === "string" ? json.reason.trim() : "";
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!applicationId) {
    return new Response(
      JSON.stringify({ error: "application_id is required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
  if (reason.length < 10) {
    return new Response(
      JSON.stringify({ error: "reason must be at least 10 characters" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const siteUrl = (
    Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000"
  ).replace(/\/$/, "");

  try {
    // Applicant-owned read — RLS ensures only the applicant sees their own app.
    const { data: appRow, error: appErr } = await userClient
      .from("applications")
      .select("id, job_id, user_id")
      .eq("id", applicationId)
      .maybeSingle();

    if (appErr) throw appErr;
    if (!appRow || appRow.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: job, error: jobErr } = await userClient
      .from("job_listings")
      .select("id, title, slug, company_id, companies ( name )")
      .eq("id", appRow.job_id)
      .maybeSingle();

    if (jobErr) throw jobErr;

    // deno-lint-ignore no-explicit-any
    const j = job as any;
    const jobTitle: string = j?.title ?? "Anunț de muncă";
    const slug: string = j?.slug ?? "";
    const companyName: string =
      (j?.companies as { name: string } | null)?.name ?? "Compania";
    const jobUrl = slug ? `${siteUrl}/jobs/${slug}` : siteUrl;

    const { data: profile } = await userClient
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const applicantName =
      (profile as { full_name: string | null } | null)?.full_name?.trim() ||
      (typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null) ||
      user.email ||
      "Candidat";

    const { data: posterRows, error: posterErr } = await userClient.rpc(
      "application_notification_recipient",
      { p_job_id: appRow.job_id }
    );
    if (posterErr) throw posterErr;

    // deno-lint-ignore no-explicit-any
    const poster = (posterRows as any[])?.[0] as
      | { poster_name?: string | null; poster_user_id?: string | null }
      | undefined;

    const posterUserId =
      typeof poster?.poster_user_id === "string"
        ? poster.poster_user_id
        : null;

    if (!posterUserId) {
      return new Response(
        JSON.stringify({
          ok: true,
          sent: false,
          skipped: "no poster resolved",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const heading = "Un candidat și-a retras candidatura";
    const bodyHtml = `
      <p>Salut,</p>
      <p>
        Candidatul
        <strong>${escapeHtml(applicantName)}</strong>
        și-a retras candidatura pentru anunțul
        <strong>${escapeHtml(jobTitle)}</strong>
        publicat de <strong>${escapeHtml(companyName)}</strong>.
      </p>
      ${infoTable(
        [
          detailRow("Anunț", escapeHtml(jobTitle)),
          detailRow("Companie", escapeHtml(companyName)),
          detailRow("Candidat", escapeHtml(applicantName)),
        ].join("")
      )}
      <p style="margin-top:16px;"><strong>Motiv:</strong></p>
      <blockquote style="
        margin:8px 0 0;
        padding:12px 16px;
        background:#F6F8F5;
        border-left:4px solid #4CAF50;
        border-radius:6px;
        color:#1A2B1F;
        font-size:14px;
        line-height:1.6;
        white-space:pre-wrap;
      ">${formatReasonHtml(reason)}</blockquote>
    `;

    const html = buildEmail({
      heading,
      bodyHtml,
      ctaUrl: jobUrl,
      ctaLabel: "Vezi anunțul",
      siteUrl,
      preheader: `${applicantName} a retras candidatura pentru „${jobTitle}”.`,
    });

    const result = await invokeNotifications(serviceKey, supabaseUrl, {
      recipient: posterUserId,
      channel: "email",
      subject: `Candidatură retrasă — „${jobTitle}”`,
      body: html,
      idempotency_key: `application-withdrawn/${applicationId}`,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        sent: result.sent === true,
        skipped: result.skipped,
        error: result.error,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("application-withdrawn:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
