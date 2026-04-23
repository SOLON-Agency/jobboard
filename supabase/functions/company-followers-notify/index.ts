/**
 * company-followers-notify — Supabase Edge Function
 *
 * Notifies all users who have favourited a company about two events:
 *   - "company_updated": the company edited its profile details.
 *   - "job_created":     the company published a new job listing.
 *
 * Auth: Supabase user JWT (the recruiter / company owner or member).
 *   The caller must be a member of the company to prevent spoofing.
 *
 * Followers are fetched via the service-role client (company_favourites has
 * per-user RLS so the recruiter cannot read other users' rows directly).
 * Each follower's email preference is respected by the `notifications` fn.
 *
 * Body:
 *   { company_id: string,
 *     event: "company_updated" | "job_created",
 *     job_id?: string,      // required for job_created
 *     job_title?: string,   // required for job_created
 *     job_slug?: string }   // required for job_created
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

type Event = "company_updated" | "job_created";

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
  } catch { /* non-JSON */ }
  const out = parsed as { ok?: boolean; sent?: boolean; skipped?: string; error?: string };
  if (!res.ok) return { ok: false, error: out.error || text || res.statusText };
  if (out.ok === false) return { ok: false, error: out.error || "notifications failed" };
  return { ok: true, sent: out.sent === true, skipped: out.skipped, error: out.error };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function buildCompanyUpdatedEmail(
  companyName: string,
  companyUrl: string,
  siteUrl: string
): string {
  const heading = `${escapeHtml(companyName)} și-a actualizat profilul`;
  const bodyHtml = `
    <p>Salut,</p>
    <p>
      Compania <strong>${escapeHtml(companyName)}</strong>, pe care o urmărești,
      și-a actualizat recent informațiile de profil.
    </p>
    ${infoTable(detailRow("Companie", escapeHtml(companyName)))}
    <p>Vizitează profilul actualizat pentru a vedea ce s-a schimbat.</p>
  `;
  return buildEmail({
    heading,
    bodyHtml,
    ctaUrl: companyUrl,
    ctaLabel: "Vezi profilul companiei",
    siteUrl,
    preheader: `${companyName} și-a actualizat profilul pe LegalJobs.`,
  });
}

function buildJobCreatedEmail(
  companyName: string,
  jobTitle: string,
  jobUrl: string,
  siteUrl: string
): string {
  const heading = `Anunț nou de la ${escapeHtml(companyName)}`;
  const bodyHtml = `
    <p>Salut,</p>
    <p>
      Compania <strong>${escapeHtml(companyName)}</strong>, pe care o urmărești,
      a publicat un nou anunț de angajare.
    </p>
    ${infoTable(
      [
        detailRow("Companie", escapeHtml(companyName)),
        detailRow("Post", escapeHtml(jobTitle)),
      ].join("")
    )}
    <p>Aplică acum dacă postul ți se potrivește!</p>
  `;
  return buildEmail({
    heading,
    bodyHtml,
    ctaUrl: jobUrl,
    ctaLabel: "Vezi anunțul",
    siteUrl,
    preheader: `${companyName} a publicat: „${jobTitle}".`,
  });
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

  // ── Authenticate the recruiter ─────────────────────────────────────────────
  const recruiterClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: { user: recruiter }, error: authErr } = await recruiterClient.auth.getUser();
  if (authErr || !recruiter?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let companyId = "";
  let event: Event = "company_updated";
  let jobId = "";
  let jobTitle = "";
  let jobSlug = "";
  try {
    const json = (await req.json()) as {
      company_id?: string;
      event?: string;
      job_id?: string;
      job_title?: string;
      job_slug?: string;
    };
    companyId = typeof json.company_id === "string" ? json.company_id.trim() : "";
    event = json.event === "job_created" ? "job_created" : "company_updated";
    jobId = typeof json.job_id === "string" ? json.job_id.trim() : "";
    jobTitle = typeof json.job_title === "string" ? json.job_title.trim() : "";
    jobSlug = typeof json.job_slug === "string" ? json.job_slug.trim() : "";
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!companyId) {
    return new Response(JSON.stringify({ error: "company_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const siteUrl = (
    Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000"
  ).replace(/\/$/, "");

  try {
    // ── Verify the recruiter is a member of this company (anti-spoofing) ─────
    const { data: membership, error: memberErr } = await recruiterClient
      .from("company_users")
      .select("role")
      .eq("company_id", companyId)
      .eq("user_id", recruiter.id)
      .not("accepted_at", "is", null)
      .maybeSingle();

    if (memberErr) throw memberErr;
    if (!membership) {
      return new Response(
        JSON.stringify({ error: "Forbidden: not a member of this company" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Fetch company details ──────────────────────────────────────────────
    const serviceClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: company, error: companyErr } = await serviceClient
      .from("companies")
      .select("id, name, slug")
      .eq("id", companyId)
      .maybeSingle();

    if (companyErr) throw companyErr;
    if (!company) {
      return new Response(JSON.stringify({ error: "Company not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // deno-lint-ignore no-explicit-any
    const c = company as any;
    const companyName: string = c.name ?? "Compania";
    const companySlug: string = c.slug ?? "";
    const companyUrl = companySlug ? `${siteUrl}/companies/${companySlug}` : siteUrl;

    // ── Fetch all followers of this company ───────────────────────────────
    const { data: followers, error: followersErr } = await serviceClient
      .from("company_favourites")
      .select("user_id")
      .eq("company_id", companyId);

    if (followersErr) throw followersErr;
    if (!followers || followers.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, skipped: "no followers" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Build email HTML ──────────────────────────────────────────────────
    let subject: string;
    let html: string;

    if (event === "job_created") {
      const resolvedJobTitle = jobTitle || "Anunț nou";
      const jobUrl = jobSlug ? `${siteUrl}/jobs/${jobSlug}` : companyUrl;
      subject = `Anunț nou de la ${companyName}: „${resolvedJobTitle}"`;
      html = buildJobCreatedEmail(companyName, resolvedJobTitle, jobUrl, siteUrl);
    } else {
      subject = `${companyName} și-a actualizat profilul`;
      html = buildCompanyUpdatedEmail(companyName, companyUrl, siteUrl);
    }

    // ── Notify each follower concurrently ─────────────────────────────────
    const results = await Promise.allSettled(
      // deno-lint-ignore no-explicit-any
      (followers as any[]).map((row: { user_id: string }) =>
        invokeNotifications(serviceKey, supabaseUrl, {
          recipient: row.user_id,
          channel: "email",
          subject,
          body: html,
          idempotency_key: `company-followers-notify/${companyId}/${event}/${jobId || Date.now()}/${row.user_id}`,
        })
      )
    );

    const sent = results.filter(
      (r) => r.status === "fulfilled" && r.value.sent === true
    ).length;
    const errors = results.filter((r) => r.status === "rejected").length;

    console.log(
      `company-followers-notify: event=${event} company=${companyId} followers=${followers.length} sent=${sent} errors=${errors}`
    );

    return new Response(
      JSON.stringify({ ok: true, sent, total: followers.length, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("company-followers-notify:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
