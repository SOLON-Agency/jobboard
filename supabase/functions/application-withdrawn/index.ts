/**
 * application-withdrawn — Supabase Edge Function
 *
 * Invoked when a candidate withdraws their application. Notifies both the
 * job poster and the candidate via the v2 notifications dispatcher.
 *
 * Body: { application_id: string, reason: string }
 * Auth: Supabase user JWT (the applicant).
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

async function invokeNotifications(
  serviceKey: string,
  supabaseUrl: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
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
  try { parsed = JSON.parse(text) as Record<string, unknown>; } catch { /* non-JSON */ }
  const out = parsed as { ok?: boolean; error?: string };
  if (!res.ok) return { ok: false, error: out.error ?? text ?? res.statusText };
  return { ok: true };
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
      JSON.stringify({ error: "Server misconfigured: SUPABASE_SERVICE_ROLE_KEY missing" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let applicationId = "";
  let reason = "";
  try {
    const json = (await req.json()) as { application_id?: string; reason?: string };
    applicationId = typeof json.application_id === "string" ? json.application_id.trim() : "";
    reason = typeof json.reason === "string" ? json.reason.trim() : "";
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!applicationId) {
    return new Response(JSON.stringify({ error: "application_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (reason.length < 10) {
    return new Response(JSON.stringify({ error: "reason must be at least 10 characters" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const siteUrl = (Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000").replace(/\/$/, "");

  try {
    const { data: appRow, error: appErr } = await userClient
      .from("applications")
      .select("id, job_id, user_id")
      .eq("id", applicationId)
      .maybeSingle();

    if (appErr) throw appErr;
    if (!appRow || appRow.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Application not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: job, error: jobErr } = await userClient
      .from("job_listings")
      .select("id, title, slug, companies(name)")
      .eq("id", appRow.job_id)
      .maybeSingle();

    if (jobErr) throw jobErr;

    // deno-lint-ignore no-explicit-any
    const j = job as any;
    const jobTitle: string = j?.title ?? "Anunț de muncă";
    const slug: string = j?.slug ?? "";
    const companyName: string = (j?.companies as { name: string } | null)?.name ?? "Compania";
    const jobUrl = slug ? `${siteUrl}/jobs/${slug}` : siteUrl;

    const { data: profile } = await userClient
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    // deno-lint-ignore no-explicit-any
    const applicantName = (profile as any)?.full_name?.trim() ||
      (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
      user.email || "Candidat";

    const { data: posterRows, error: posterErr } = await userClient.rpc(
      "application_notification_recipient",
      { p_job_id: appRow.job_id }
    );
    if (posterErr) throw posterErr;

    // deno-lint-ignore no-explicit-any
    const poster = (posterRows as any[])?.[0] as { poster_user_id?: string | null } | undefined;
    const posterUserId = typeof poster?.poster_user_id === "string" ? poster.poster_user_id : null;

    if (!posterUserId) {
      return new Response(
        JSON.stringify({ ok: true, sent: false, skipped: "no poster resolved" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sharedData = {
      job_title: jobTitle,
      company_name: companyName,
      applicant_name: applicantName,
      reason,
      job_url: jobUrl,
      site_url: siteUrl,
    };

    // Notify poster
    const posterResult = await invokeNotifications(serviceKey, supabaseUrl, {
      type: "application_withdrawn",
      recipients: [posterUserId],
      data: { ...sharedData, recipient_role: "creator" },
      idempotency_key: `application-withdrawn/${applicationId}/creator`,
    });

    // Notify candidate (confirmation)
    await invokeNotifications(serviceKey, supabaseUrl, {
      type: "application_withdrawn",
      recipients: [user.id],
      data: { ...sharedData, recipient_role: "candidate" },
      idempotency_key: `application-withdrawn/${applicationId}/candidate`,
    });

    return new Response(
      JSON.stringify({ ok: true, sent: posterResult.ok, error: posterResult.error }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("application-withdrawn:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
