/**
 * application-rejected — Supabase Edge Function
 *
 * Invoked by the recruiter after setting an application to "rejected".
 * Notifies the candidate via the v2 notifications dispatcher.
 *
 * Auth: Supabase user JWT (the recruiter).
 * Body: { application_id: string }
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

  let applicationId = "";
  try {
    const json = (await req.json()) as { application_id?: string };
    applicationId = typeof json.application_id === "string" ? json.application_id.trim() : "";
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

  const siteUrl = (Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000").replace(/\/$/, "");

  try {
    const { data: appRow, error: appErr } = await recruiterClient
      .from("applications")
      .select("id, job_id, user_id, status")
      .eq("id", applicationId)
      .maybeSingle();

    if (appErr) throw appErr;
    if (!appRow) {
      return new Response(JSON.stringify({ error: "Application not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (appRow.status !== "rejected") {
      return new Response(
        JSON.stringify({ error: "Application is not in rejected status" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: job, error: jobErr } = await recruiterClient
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
    const jobUrl = slug ? `${siteUrl}/jobs/${slug}` : `${siteUrl}/jobs`;

    const serviceClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: candidateProfile } = await serviceClient
      .from("profiles")
      .select("full_name")
      .eq("id", appRow.user_id)
      .maybeSingle();

    // deno-lint-ignore no-explicit-any
    const candidateName: string = (candidateProfile as any)?.full_name?.trim() || "Candidat";

    const result = await invokeNotifications(serviceKey, supabaseUrl, {
      type: "application_rejected",
      recipients: [appRow.user_id],
      data: {
        job_title: jobTitle,
        company_name: companyName,
        candidate_name: candidateName,
        job_url: jobUrl,
        site_url: siteUrl,
      },
      idempotency_key: `application-rejected/${applicationId}`,
    });

    return new Response(
      JSON.stringify({ ok: true, sent: result.ok, error: result.error }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("application-rejected:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
