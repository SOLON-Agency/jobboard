/**
 * alerts-job-match — Supabase Edge Function
 *
 * Called by the recruiter's browser immediately after a job is published.
 * Finds every active, non-archived alert whose filter criteria match the new
 * job listing and sends a notification email to each alert owner.
 *
 * Auth: Supabase user JWT (the recruiter / company owner who published the job).
 *   The caller must be authenticated; alert matching and fan-out use the service-
 *   role client so user RLS is bypassed for the internal lookup.
 *
 * Body: { job_id: string }
 *
 * Required secrets: SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_FROM,
 *                   NEXT_PUBLIC_SITE_URL.
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import {
  buildEmail,
  detailRow,
  infoTable,
} from "../_shared/email-templates.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const filterLabels: Record<string, string> = {
  q:           "Cuvinte cheie",
  location:    "Locație",
  type:        "Tip de contract",
  experience:  "Nivel de experiență",
  salaryMin:   "Salariu minim",
  salaryMax:   "Salariu maxim",
  remote:      "La distanță",
  minBenefits: "Min. beneficii",
};

function buildAlertEmail(
  alertName: string,
  job: JobRow,
  jobUrl: string,
  siteUrl: string,
): string {
  const heading = `Alertă „${escapeHtml(alertName)}": anunț nou`;
  const rows = [
    detailRow("Post", escapeHtml(job.title)),
    job.companies?.name
      ? detailRow("Companie", escapeHtml(job.companies.name))
      : "",
    job.location ? detailRow("Locație", escapeHtml(job.location)) : "",
    job.job_type ? detailRow("Tip", escapeHtml(job.job_type)) : "",
    job.is_remote ? detailRow("Remote", "Da") : "",
    job.salary_min != null
      ? detailRow(
          "Salariu",
          job.salary_max != null
            ? `${job.salary_min.toLocaleString("ro")} – ${job.salary_max.toLocaleString("ro")} RON`
            : `de la ${job.salary_min.toLocaleString("ro")} RON`,
        )
      : "",
  ]
    .filter(Boolean)
    .join("");

  const bodyHtml = `
    <p>Salut,</p>
    <p>
      A apărut un anunț nou care corespunde alertei tale
      <strong>„${escapeHtml(alertName)}"</strong>.
    </p>
    ${infoTable(rows)}
    <p>Aplică acum dacă postul ți se potrivește!</p>
  `;

  return buildEmail({
    heading,
    bodyHtml,
    ctaUrl: jobUrl,
    ctaLabel: "Vezi anunțul",
    siteUrl,
    preheader: `Alertă „${alertName}": ${job.title}${job.companies?.name ? ` la ${job.companies.name}` : ""}.`,
  });
}

async function invokeNotifications(
  serviceKey: string,
  supabaseUrl: string,
  body: Record<string, unknown>,
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
  } catch { /* non-JSON */ }
  const out = parsed as { ok?: boolean; sent?: boolean; skipped?: string; error?: string };
  if (!res.ok) return { ok: false, error: out.error ?? text ?? res.statusText };
  if (out.ok === false) return { ok: false, error: out.error ?? "notifications failed" };
  return { ok: true, sent: out.sent === true, skipped: out.skipped };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Authenticate the caller ────────────────────────────────────────────────
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
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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

  // ── Parse body ─────────────────────────────────────────────────────────────
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
    const serviceClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // ── Fetch the job (verify it is published) ─────────────────────────────
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
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Find all matching alerts via SECURITY DEFINER RPC ─────────────────
    const { data: matchedAlerts, error: rpcErr } = await serviceClient
      .rpc("alerts_matching_job", { _job_id: jobId });

    if (rpcErr) throw rpcErr;
    if (!matchedAlerts || matchedAlerts.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, total: 0, skipped: "no matching alerts" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const jobUrl = `${siteUrl}/jobs/${j.slug}`;
    const subject = `Alertă: anunț nou – ${j.title}${j.companies?.name ? ` la ${j.companies.name}` : ""}`;

    // ── Send notification + update last_sent_at per alert ─────────────────
    // deno-lint-ignore no-explicit-any
    const results = await Promise.allSettled((matchedAlerts as any[]).map(async (alert: AlertRow) => {
      const html = buildAlertEmail(alert.name, j, jobUrl, siteUrl);
      const notifResult = await invokeNotifications(serviceKey, supabaseUrl, {
        recipient: alert.user_id,
        channel: "email",
        subject,
        body: html,
        idempotency_key: `alerts-job-match/${alert.id}/${jobId}`,
      });

      if (notifResult.sent) {
        await serviceClient
          .from("alerts")
          .update({ last_sent_at: new Date().toISOString() })
          .eq("id", alert.id);
      }

      return notifResult;
    }));

    const sent   = results.filter((r) => r.status === "fulfilled" && (r.value as { sent?: boolean }).sent === true).length;
    const errors = results.filter((r) => r.status === "rejected").length;

    console.log(`alerts-job-match: job=${jobId} matched=${matchedAlerts.length} sent=${sent} errors=${errors}`);

    return new Response(
      JSON.stringify({ ok: true, sent, total: matchedAlerts.length, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("alerts-job-match:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
