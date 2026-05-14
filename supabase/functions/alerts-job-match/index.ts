/**
 * alerts-job-match — Supabase Edge Function
 *
 * Called after a job is published. Finds every matching alert and notifies
 * the alert owner via the v2 notifications dispatcher.
 *
 * Auth: Supabase user JWT (recruiter who published the job).
 * Body: { job_id: string }
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

interface AlertRow {
  id: string;
  user_id: string;
  name: string;
  filters: Record<string, string>;
}

interface JobRow {
  id: string;
  title: string;
  slug: string;
  location: string | null;
  job_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  is_remote: boolean;
  companies: { name: string; slug: string | null } | null;
}

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

  const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: { user: caller }, error: authErr } = await callerClient.auth.getUser();
  if (authErr || !caller?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let jobId = "";
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
    const serviceClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { data: job, error: jobErr } = await serviceClient
      .from("job_listings")
      .select("id, title, slug, location, job_type, salary_min, salary_max, is_remote, status, is_archived, companies(name, slug)")
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
    const j = job as any as JobRow & { status: string; is_archived: boolean };

    if (j.status !== "published" || j.is_archived) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, skipped: "job not published or archived" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: matchedAlerts, error: rpcErr } = await serviceClient
      .rpc("alerts_matching_job", { _job_id: jobId });

    if (rpcErr) throw rpcErr;
    if (!matchedAlerts || matchedAlerts.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, total: 0, skipped: "no matching alerts" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jobUrl = `${siteUrl}/jobs/${j.slug}`;
    const jobData = {
      job_title: j.title,
      company_name: j.companies?.name ?? "",
      job_url: jobUrl,
      location: j.location ?? "",
      job_type: j.job_type ?? "",
      salary_min: j.salary_min,
      salary_max: j.salary_max,
      is_remote: j.is_remote,
      site_url: siteUrl,
    };

    let sent = 0;
    const errors: string[] = [];

    // deno-lint-ignore no-explicit-any
    await Promise.allSettled((matchedAlerts as any[]).map(async (alert: AlertRow) => {
      try {
        const result = await invokeNotifications(serviceKey, supabaseUrl, {
          type: "alert_job_match",
          recipients: [alert.user_id],
          data: { ...jobData, alert_name: alert.name },
          idempotency_key: `alerts-job-match/${alert.id}/${jobId}`,
        });

        if (result.ok) {
          sent++;
          await serviceClient
            .from("alerts")
            .update({ last_sent_at: new Date().toISOString() })
            .eq("id", alert.id);
        } else {
          errors.push(`alert ${alert.id}: ${result.error ?? "unknown"}`);
        }
      } catch (e) {
        errors.push(`alert ${alert.id}: ${String(e)}`);
      }
    }));

    console.log(`alerts-job-match: job=${jobId} matched=${matchedAlerts.length} sent=${sent} errors=${errors.length}`);

    return new Response(
      JSON.stringify({ ok: true, sent, total: matchedAlerts.length, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("alerts-job-match:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
