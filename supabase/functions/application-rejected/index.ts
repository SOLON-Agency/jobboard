/**
 * application-rejected — Supabase Edge Function
 *
 * Invoked by the job poster (recruiter) after setting an application status
 * to "rejected". The status update is persisted by the client beforehand;
 * this function's sole responsibility is to notify the candidate via the
 * `notifications` Edge Function so they can learn their application outcome.
 *
 * Auth: Supabase user JWT (the recruiter / job poster).
 * RLS guarantees the recruiter can only read applications for their own jobs.
 *
 * Required secrets: SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_FROM,
 *                   NEXT_PUBLIC_SITE_URL (same set as other notification fns).
 *
 * Body: { application_id: string }
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

  // Authenticate the recruiter via their JWT.
  const recruiterClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const {
    data: { user: recruiter },
    error: authErr,
  } = await recruiterClient.auth.getUser();

  if (authErr || !recruiter?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let applicationId = "";
  try {
    const json = (await req.json()) as { application_id?: string };
    applicationId =
      typeof json.application_id === "string"
        ? json.application_id.trim()
        : "";
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

  const siteUrl = (
    Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000"
  ).replace(/\/$/, "");

  try {
    // Read the application using the recruiter's session. RLS ensures they can
    // only access applications for jobs belonging to their own companies.
    const { data: appRow, error: appErr } = await recruiterClient
      .from("applications")
      .select("id, job_id, user_id, status")
      .eq("id", applicationId)
      .maybeSingle();

    if (appErr) throw appErr;
    if (!appRow) {
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (appRow.status !== "rejected") {
      return new Response(
        JSON.stringify({
          error: "Application is not in rejected status",
        }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch job + company details for the email body.
    const { data: job, error: jobErr } = await recruiterClient
      .from("job_listings")
      .select("id, title, slug, companies ( name )")
      .eq("id", appRow.job_id)
      .maybeSingle();

    if (jobErr) throw jobErr;

    // deno-lint-ignore no-explicit-any
    const j = job as any;
    const jobTitle: string = j?.title ?? "Anunț de muncă";
    const slug: string = j?.slug ?? "";
    const companyName: string =
      (j?.companies as { name: string } | null)?.name ?? "Compania";
    const jobsUrl = `${siteUrl}/jobs`;
    const jobUrl = slug ? `${siteUrl}/jobs/${slug}` : jobsUrl;

    // Resolve candidate's name via the service-role client so we can
    // personalise the email without relying on recruiter-readable profile data.
    const serviceClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: candidateProfile } = await serviceClient
      .from("profiles")
      .select("full_name")
      .eq("id", appRow.user_id)
      .maybeSingle();

    // deno-lint-ignore no-explicit-any
    const candidateName: string =
      (candidateProfile as any)?.full_name?.trim() || "Candidat";

    const heading = "Candidatura ta a fost analizată";
    const bodyHtml = `
      <p>Salut${candidateName !== "Candidat" ? ` <strong>${escapeHtml(candidateName)}</strong>` : ""},</p>
      <p>
        Îți mulțumim pentru interesul acordat și pentru că ai aplicat la
        <strong>${escapeHtml(jobTitle)}</strong> în cadrul
        <strong>${escapeHtml(companyName)}</strong>.
      </p>
      <p>
        În urma procesului de selecție, am decis să continuăm cu alți candidați
        care corespund mai bine cerințelor actuale ale postului.
      </p>
      ${infoTable(
        [
          detailRow("Post", escapeHtml(jobTitle)),
          detailRow("Companie", escapeHtml(companyName)),
          detailRow("Status", "Respinsă"),
        ].join("")
      )}
      <p>
        Nu te descuraja — continuă să explorezi oportunitățile disponibile pe
        platformă. Îți dorim mult succes în căutarea ta!
      </p>
    `;

    const html = buildEmail({
      heading,
      bodyHtml,
      ctaUrl: jobsUrl,
      ctaLabel: "Explorează alte anunțuri",
      siteUrl,
      preheader: `Candidatura ta pentru „${jobTitle}" la ${companyName} a fost respinsă.`,
    });

    const result = await invokeNotifications(serviceKey, supabaseUrl, {
      recipient: appRow.user_id,
      channel: "email",
      subject: `Candidatura ta pentru „${escapeHtml(jobTitle)}" — răspuns`,
      body: html,
      idempotency_key: `application-rejected/${applicationId}`,
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
    console.error("application-rejected:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
