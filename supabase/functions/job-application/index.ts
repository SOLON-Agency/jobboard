/**
 * job-application — Supabase Edge Function
 *
 * Called after a candidate successfully applies to a job. Sends transactional
 * emails via the `notifications` Edge Function using Resend dashboard templates:
 *   • job creator  — template id from RESEND_TEMPLATE_JOB_CREATOR (default: job-creator)
 *   • applicant    — template id from RESEND_TEMPLATE_JOB_CANDIDAT (default: job-candidat)
 *
 * Email is sent only when `profiles.notifications_email` is true for that user
 * (same semantics as “email notifications enabled”; checked here before invoking
 * `notifications`, which checks again).
 *
 * Required secrets: same as `notifications` (SUPABASE_SERVICE_ROLE_KEY, RESEND_*, etc.)
 *
 * Body: { job_id: string }
 * Auth: Supabase user JWT (the applicant).
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

// Template variables passed to Resend (keys must match your published templates).
// We send both JOB_TITLE and job_name so templates using either naming style work.
const TEMPLATE_VARS = {
  JOB_TITLE: "JOB_TITLE",
  JOB_NAME: "job_name",
  COMPANY_NAME: "COMPANY_NAME",
  APPLICANT_NAME: "APPLICANT_NAME",
  /** Common alternate keys used in Resend dashboard templates */
  FULL_NAME: "FULL_NAME",
  fullname: "fullname",
  POSTER_NAME: "POSTER_NAME",
  JOB_URL: "JOB_URL",
  SITE_URL: "SITE_URL",
} as const;

async function notificationsEmailEnabled(
  // deno-lint-ignore no-explicit-any
  admin: any,
  userId: string
): Promise<boolean> {
  const { data, error } = await admin
    .from("profiles")
    .select("notifications_email")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn(`job-application: profile read ${userId}:`, error.message);
    return true;
  }
  if (!data) return true;
  return data.notifications_email !== false;
}

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
    /* ignore */
  }

  const out = parsed as { ok?: boolean; sent?: boolean; skipped?: string; error?: string };
  if (!res.ok) {
    return { ok: false, error: out.error || text || res.statusText };
  }
  if (out.ok === false) {
    return { ok: false, error: out.error || text || "notifications failed" };
  }
  return { ok: true, sent: out.sent === true, skipped: out.skipped, error: out.error };
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

  const siteUrl = (
    Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000"
  ).replace(/\/$/, "");

  const templateCreator =
    Deno.env.get("RESEND_TEMPLATE_JOB_CREATOR")?.trim() || "job-creator";
  const templateCandidat =
    Deno.env.get("RESEND_TEMPLATE_JOB_CANDIDAT")?.trim() || "job-candidat";

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

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
      .select("id, title, slug, company_id, companies ( name )")
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
    const companyName: string =
      (j.companies as { name: string } | null)?.name ?? "Compania";
    const jobTitle: string = j.title ?? "";
    const slug: string = j.slug ?? "";
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
      { p_job_id: jobId }
    );
    if (posterErr) throw posterErr;

    // deno-lint-ignore no-explicit-any
    const poster = (posterRows as any[])?.[0] as
      | {
          poster_name?: string | null;
          poster_user_id?: string | null;
        }
      | undefined;

    const posterName = poster?.poster_name?.trim() || "Angajator";
    const posterUserId =
      typeof poster?.poster_user_id === "string"
        ? poster.poster_user_id
        : null;

    const baseVars: Record<string, string> = {
      [TEMPLATE_VARS.JOB_TITLE]: jobTitle,
      [TEMPLATE_VARS.JOB_NAME]: jobTitle,
      [TEMPLATE_VARS.COMPANY_NAME]: companyName,
      [TEMPLATE_VARS.APPLICANT_NAME]: applicantName,
      [TEMPLATE_VARS.FULL_NAME]: applicantName,
      [TEMPLATE_VARS.fullname]: applicantName,
      [TEMPLATE_VARS.POSTER_NAME]: posterName,
      [TEMPLATE_VARS.JOB_URL]: jobUrl,
      [TEMPLATE_VARS.SITE_URL]: siteUrl,
    };

    const applicantWantsEmail = await notificationsEmailEnabled(admin, user.id);
    const posterWantsEmail = posterUserId
      ? await notificationsEmailEnabled(admin, posterUserId)
      : false;

    let applicantSent = false;
    let creatorSent = false;
    const notes: string[] = [];

    if (applicantWantsEmail) {
      const r = await invokeNotifications(serviceKey, supabaseUrl, {
        recipient: user.id,
        channel: "email",
        subject: `Candidatura ta pentru „${jobTitle}” a fost înregistrată`,
        resend_template: {
          id: templateCandidat,
          variables: baseVars,
        },
        idempotency_key: `job-application/applicant/${jobId}/${user.id}`,
      });
      if (r.ok && r.sent) applicantSent = true;
      else if (r.skipped) notes.push(`applicant: ${r.skipped}`);
      else if (r.error) notes.push(`applicant: ${r.error}`);
    } else {
      notes.push("applicant: notifications_email disabled");
    }

    if (posterUserId && posterWantsEmail && posterUserId !== user.id) {
      const r = await invokeNotifications(serviceKey, supabaseUrl, {
        recipient: posterUserId,
        channel: "email",
        subject: `Candidatură nouă pentru „${jobTitle}”`,
        resend_template: {
          id: templateCreator,
          variables: baseVars,
        },
        idempotency_key: `job-application/creator/${jobId}/${user.id}`,
      });
      if (r.ok && r.sent) creatorSent = true;
      else if (r.skipped) notes.push(`creator: ${r.skipped}`);
      else if (r.error) notes.push(`creator: ${r.error}`);
    } else if (posterUserId && !posterWantsEmail) {
      notes.push("creator: notifications_email disabled");
    } else if (!posterUserId) {
      notes.push("creator: no poster resolved");
    }

    return new Response(
      JSON.stringify({
        ok: true,
        applicantSent,
        creatorSent,
        notes,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("job-application:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
