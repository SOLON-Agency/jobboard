/**
 * company-followers-notify — Supabase Edge Function
 *
 * Notifies users who have favourited a company about two events:
 *   - "company_updated": the company edited its profile.
 *   - "job_created":     the company published a new job listing.
 *
 * Uses the v2 notifications dispatcher (typed mode).
 *
 * Auth: Supabase user JWT (recruiter / company member).
 * Body: { company_id, event, job_id?, job_title?, job_slug? }
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

type CompanyEvent = "company_updated" | "job_created";

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

  let companyId = "";
  let event: CompanyEvent = "company_updated";
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

  const siteUrl = (Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000").replace(/\/$/, "");

  try {
    // Verify membership (anti-spoofing)
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

    const serviceClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

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

    // deno-lint-ignore no-explicit-any
    const followerIds = (followers as any[]).map((f: { user_id: string }) => f.user_id);

    const notifType = event === "job_created" ? "job_created" : "company_updated";
    const resolvedJobTitle = jobTitle || "Anunț nou";
    const jobUrl = jobSlug ? `${siteUrl}/jobs/${jobSlug}` : companyUrl;

    const notifData = event === "job_created"
      ? { job_title: resolvedJobTitle, company_name: companyName, company_url: companyUrl, job_url: jobUrl, site_url: siteUrl }
      : { company_name: companyName, company_url: companyUrl, site_url: siteUrl };

    const result = await invokeNotifications(serviceKey, supabaseUrl, {
      type: notifType,
      recipients: followerIds,
      data: notifData,
      idempotency_key: `company-followers-notify/${companyId}/${event}/${jobId || Date.now()}`,
    });

    console.log(`company-followers-notify: event=${event} company=${companyId} followers=${followerIds.length} ok=${result.ok}`);

    return new Response(
      JSON.stringify({ ok: result.ok, total: followerIds.length, error: result.error }),
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
