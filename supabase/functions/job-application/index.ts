/**
 * job-application — Supabase Edge Function
 *
 * Called after a candidate successfully applies to a job.
 * Dispatches APPLICATION_NEW notifications to the applicant and the job poster
 * via the v2 notifications dispatcher.
 *
 * Body: { job_id: string }
 * Auth: Supabase user JWT (the applicant).
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

async function invokeNotifications(
  serviceKey: string,
  supabaseUrl: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; sent?: number; error?: string }> {
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
  try { parsed = JSON.parse(text) as Record<string, unknown>; } catch { /* ignore */ }
  const out = parsed as { ok?: boolean; sent?: number; error?: string };
  if (!res.ok) return { ok: false, error: out.error ?? text ?? res.statusText };
  return { ok: true, sent: out.sent as number | undefined, error: out.error };
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

  let jobId: string;
  try {
    const json = (await req.json()) as { job_id?: string };
    jobId = typeof json.job_id === "string" ? json.job_id.trim() : "";
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!jobId) {
    return new Response(JSON.stringify({ error: "job_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const siteUrl = (Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000").replace(/\/$/, "");

  try {
    const { data: appRow, error: appErr } = await userClient
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (appErr) throw appErr;
    if (!appRow) {
      return new Response(
        JSON.stringify({ error: "No application found for this job" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: job, error: jobErr } = await userClient
      .from("job_listings")
      .select("id, title, slug, company_id, companies(name)")
      .eq("id", jobId)
      .maybeSingle();

    if (jobErr) throw jobErr;
    if (!job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // deno-lint-ignore no-explicit-any
    const j = job as any;
    const companyName: string = (j.companies as { name: string } | null)?.name ?? "Compania";
    const jobTitle: string = j.title ?? "";
    const slug: string = j.slug ?? "";
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
      { p_job_id: jobId }
    );
    if (posterErr) throw posterErr;

    // deno-lint-ignore no-explicit-any
    const poster = (posterRows as any[])?.[0] as { poster_name?: string | null; poster_user_id?: string | null } | undefined;
    const posterUserId = typeof poster?.poster_user_id === "string" ? poster.poster_user_id : null;

    const sharedData = {
      job_title: jobTitle,
      company_name: companyName,
      applicant_name: applicantName,
      job_url: jobUrl,
      site_url: siteUrl,
    };

    const notes: string[] = [];

    // Notify applicant
    const appResult = await invokeNotifications(serviceKey, supabaseUrl, {
      type: "application_new",
      recipients: [user.id],
      data: { ...sharedData, recipient_role: "candidate" },
      idempotency_key: `job-application/applicant/${jobId}/${user.id}`,
    });
    if (!appResult.ok) notes.push(`applicant: ${appResult.error}`);

    // Notify poster
    let creatorSent = false;
    if (posterUserId && posterUserId !== user.id) {
      const creatorResult = await invokeNotifications(serviceKey, supabaseUrl, {
        type: "application_new",
        recipients: [posterUserId],
        data: { ...sharedData, recipient_role: "creator" },
        idempotency_key: `job-application/creator/${jobId}/${user.id}`,
      });
      if (creatorResult.ok) creatorSent = true;
      else notes.push(`creator: ${creatorResult.error}`);
    } else if (!posterUserId) {
      notes.push("creator: no poster resolved");
    }

    return new Response(
      JSON.stringify({ ok: true, applicantSent: appResult.ok, creatorSent, notes }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("job-application:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
