/**
 * send-email — Supabase Edge Function
 *
 * Handles all transactional emails for LegalJobs via the Resend HTTP API.
 * The caller must supply a valid Supabase JWT in the Authorization header
 * (this happens automatically when using supabase.functions.invoke() with an
 * authenticated client). All database queries run under the user's JWT so
 * Postgres RLS is fully enforced.
 *
 * Required Supabase secrets (set with `supabase secrets set`):
 *   RESEND_API_KEY        — Resend API key
 *   RESEND_FROM           — verified sender, e.g. "LegalJobs <noreply@yourdomain.com>"
 *   NEXT_PUBLIC_SITE_URL  — canonical origin, e.g. "https://legaljobs.ro"
 *
 * Supported events (send in the JSON body as `event`):
 *   "application_notification"  — job application confirmation + poster alert
 *   "profile_updated"           — profile-update confirmation to the user
 *   "company_created"           — company-creation welcome email
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import {
  buildEmail,
  detailRow,
  infoTable,
} from "../_shared/email-templates.ts";
import { sendResendEmail } from "../_shared/resend.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmailEvent =
  | { event: "application_notification"; job_id: string }
  | { event: "profile_updated" }
  | { event: "company_created"; company_id: string };

// ─── Label maps ───────────────────────────────────────────────────────────────

const JOB_TYPE_LABEL: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
};

const EXPERIENCE_LABEL: Record<string, string> = {
  entry: "Entry-level",
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  lead: "Lead / Principal",
};

// ─── Email handlers ───────────────────────────────────────────────────────────

async function handleApplicationNotification(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  userEmail: string | undefined,
  // deno-lint-ignore no-explicit-any
  userMeta: Record<string, any>,
  jobId: string,
  siteUrl: string,
  siteName: string
): Promise<void> {
  const { data: appRow, error: appErr } = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("user_id", userId)
    .maybeSingle();

  if (appErr) throw appErr;
  if (!appRow) throw new Error("No application found for this job");

  const { data: job, error: jobErr } = await supabase
    .from("job_listings")
    .select(
      "id, title, slug, location, job_type, salary_min, salary_max, companies ( name, slug, logo_url, location )"
    )
    .eq("id", jobId)
    .single();

  if (jobErr) throw jobErr;

  // deno-lint-ignore no-explicit-any
  const j = job as any;
  const company = j.companies as
    | { name: string; slug: string | null; location: string | null }
    | null;
  const companyName = company?.name ?? "Compania";
  const companyUrl = company?.slug
    ? `${siteUrl}/companies/${company.slug}`
    : siteUrl;
  const jobUrl = `${siteUrl}/jobs/${j.slug}`;
  const appliedAt = new Date().toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const { data: posterRows, error: posterErr } = await supabase.rpc(
    "application_notification_recipient",
    { p_job_id: jobId }
  );
  if (posterErr) throw posterErr;

  // deno-lint-ignore no-explicit-any
  const poster = (posterRows as any[])?.[0];
  const posterEmail: string | null = poster?.poster_email ?? null;
  const posterName: string = poster?.poster_name ?? "Angajator";

  const applicantEmail = userEmail ?? null;
  const applicantName: string =
    (typeof userMeta?.full_name === "string" ? userMeta.full_name : null) ??
    applicantEmail ??
    "Candidatul";

  const { data: applicantProfile } = await supabase
    .from("profiles")
    .select("full_name, headline, location, slug, is_public, cv_url")
    .eq("id", userId)
    .maybeSingle();

  const publicProfileUrl =
    // deno-lint-ignore no-explicit-any
    (applicantProfile as any)?.is_public && (applicantProfile as any)?.slug
      ? // deno-lint-ignore no-explicit-any
        `${siteUrl}/users/${(applicantProfile as any).slug}`
      : null;

  if (posterEmail) {
    // deno-lint-ignore no-explicit-any
    const ap = applicantProfile as any;
    const posterTableRows = [
      detailRow("Candidat:", applicantName),
      ...(ap?.headline ? [detailRow("Poziție dorită:", ap.headline)] : []),
      ...(ap?.location ? [detailRow("Locație:", ap.location)] : []),
      detailRow("Data aplicării:", appliedAt),
      detailRow("Post:", j.title),
      detailRow("Companie:", companyName),
    ].join("");

    const posterBody = `
      <p>Salut, ${posterName},</p>
      <p>
        Anunțul tău <strong>${j.title}</strong> la <strong>${companyName}</strong>
        a primit o candidatură nouă de la <strong>${applicantName}</strong>.
      </p>
      ${infoTable(posterTableRows)}
      ${publicProfileUrl ? `<p>Poți vizualiza profilul candidatului pentru mai multe detalii.</p>` : ""}
    `;

    await sendResendEmail({
      to: [posterEmail],
      subject: `Candidatură nouă pentru „${j.title}"`,
      html: buildEmail({
        preheader: `${applicantName} a aplicat la postul ${j.title}`,
        heading: "Ai primit o candidatură nouă! 🎉",
        bodyHtml: posterBody,
        ctaUrl: publicProfileUrl ?? `${siteUrl}/dashboard/applications`,
        ctaLabel: publicProfileUrl
          ? "Vezi profilul candidatului"
          : "Vezi candidaturile",
        siteUrl,
        siteName,
      }),
      idempotencyKey: `application-poster/${jobId}/${userId}`,
    });
  }

  if (applicantEmail) {
    const salaryText =
      j.salary_min && j.salary_max
        ? `${(j.salary_min as number).toLocaleString("ro-RO")} – ${(j.salary_max as number).toLocaleString("ro-RO")} RON`
        : j.salary_min
          ? `De la ${(j.salary_min as number).toLocaleString("ro-RO")} RON`
          : null;

    const candidateRows = [
      detailRow("Post:", j.title),
      detailRow("Companie:", companyName),
      ...(j.location ? [detailRow("Locație:", j.location as string)] : []),
      ...(j.job_type
        ? [detailRow("Tip:", JOB_TYPE_LABEL[j.job_type as string] ?? (j.job_type as string))]
        : []),
      ...(salaryText ? [detailRow("Salariu:", salaryText)] : []),
      detailRow("Data aplicării:", appliedAt),
    ].join("");

    const candidateBody = `
      <p>Salut, ${applicantName},</p>
      <p>
        Îți mulțumim pentru candidatura ta! Am înregistrat cu succes
        aplicația ta pentru postul <strong>${j.title}</strong> la
        <a href="${companyUrl}" style="color:#03170C;font-weight:600;">${companyName}</a>.
      </p>
      ${infoTable(candidateRows)}
      <p>
        Echipa de recrutare va analiza aplicația ta și te va contacta dacă profilul
        corespunde cerințelor postului. Îți dorim mult succes!
      </p>
      <p style="font-size:13px;color:#6B7C70;margin-top:16px;">
        Nu trebuie să faci nimic altceva — candidatura ta este activă.
      </p>
    `;

    await sendResendEmail({
      to: [applicantEmail],
      subject: `Candidatura ta pentru „${j.title}" a fost trimisă!`,
      html: buildEmail({
        preheader: `Aplicația ta la ${companyName} a fost înregistrată cu succes.`,
        heading: "Candidatură înregistrată cu succes!",
        bodyHtml: candidateBody,
        ctaUrl: jobUrl,
        ctaLabel: "Vezi anunțul",
        siteUrl,
        siteName,
      }),
      idempotencyKey: `application-applicant/${jobId}/${userId}`,
    });
  }
}

async function handleProfileUpdated(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  userEmail: string | undefined,
  siteUrl: string,
  siteName: string
): Promise<void> {
  const to = userEmail?.trim();
  if (!to) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, headline, location, experience_level, is_public, slug")
    .eq("id", userId)
    .maybeSingle();

  // deno-lint-ignore no-explicit-any
  const p = profile as any;
  const name: string = p?.full_name ?? to;
  const updatedAt = new Date().toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const expLabel = p?.experience_level
    ? EXPERIENCE_LABEL[p.experience_level as string] ?? (p.experience_level as string)
    : null;

  const rows = [
    detailRow("Nume:", name),
    ...(p?.headline ? [detailRow("Titlu profesional:", p.headline as string)] : []),
    ...(p?.location ? [detailRow("Locație:", p.location as string)] : []),
    ...(expLabel ? [detailRow("Nivel experiență:", expLabel)] : []),
    detailRow("Profil public:", p?.is_public ? "Vizibil pentru toți" : "Ascuns"),
    detailRow("Actualizat la:", updatedAt),
  ].join("");

  const publicProfileUrl =
    p?.is_public && p?.slug
      ? `${siteUrl}/users/${p.slug as string}`
      : `${siteUrl}/dashboard/profile`;

  const bodyHtml = `
    <p>Salut, ${name},</p>
    <p>
      Profilul tău a fost actualizat cu succes. Iată un rezumat al informațiilor
      înregistrate momentan:
    </p>
    ${infoTable(rows)}
    <p style="font-size:13px;color:#6B7C70;">
      Dacă nu tu ai efectuat această modificare, te rugăm să îți schimbi imediat parola
      sau să ne contactezi.
    </p>
  `;

  await sendResendEmail({
    to: [to],
    subject: "Profilul tău a fost actualizat",
    html: buildEmail({
      preheader: "Modificările profilului tău au fost salvate cu succes.",
      heading: "Profil actualizat cu succes",
      bodyHtml,
      ctaUrl: publicProfileUrl,
      ctaLabel: p?.is_public ? "Vezi profilul tău public" : "Mergi la profil",
      siteUrl,
      siteName,
    }),
    idempotencyKey: `profile-updated/${userId}/${Math.floor(Date.now() / 60_000)}`,
  });
}

async function handleCompanyCreated(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  userEmail: string | undefined,
  // deno-lint-ignore no-explicit-any
  userMeta: Record<string, any>,
  companyId: string,
  siteUrl: string,
  siteName: string
): Promise<void> {
  const to = userEmail?.trim();
  if (!to) return;

  const { data: membership, error: memErr } = await supabase
    .from("company_users")
    .select("user_id")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (memErr) throw memErr;
  if (!membership) throw new Error("Not a member of this company");

  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .select(
      "name, slug, description, industry, size, location, website, founded_year"
    )
    .eq("id", companyId)
    .single();

  if (companyErr) throw companyErr;

  // deno-lint-ignore no-explicit-any
  const c = company as any;
  const userName: string =
    (typeof userMeta?.full_name === "string" ? userMeta.full_name : null) ?? to;
  const dashboardUrl = `${siteUrl}/dashboard/company`;
  const createdAt = new Date().toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const rows = [
    detailRow("Nume companie:", c.name as string),
    ...(c.industry ? [detailRow("Industrie:", c.industry as string)] : []),
    ...(c.size ? [detailRow("Dimensiune:", c.size as string)] : []),
    ...(c.location ? [detailRow("Locație:", c.location as string)] : []),
    ...(c.website
      ? [
          detailRow(
            "Website:",
            `<a href="${c.website as string}" style="color:#03170C;">${c.website as string}</a>`
          ),
        ]
      : []),
    ...(c.founded_year
      ? [detailRow("Fondată în:", String(c.founded_year))]
      : []),
    detailRow("Creată la:", createdAt),
  ].join("");

  const desc = (c.description as string | null) ?? "";
  const bodyHtml = `
    <p>Salut, ${userName},</p>
    <p>
      Felicitări! Compania ta <strong>${c.name as string}</strong> a fost creată cu succes
      pe platforma noastră. Acum poți publica anunțuri de angajare și să găsești
      candidații potriviți.
    </p>
    ${infoTable(rows)}
    ${
      desc
        ? `<p style="margin-top:16px;font-size:13px;color:#6B7C70;">
             <strong>Descriere:</strong><br/>
             ${desc.slice(0, 300)}${desc.length > 300 ? "…" : ""}
           </p>`
        : ""
    }
    <p>
      Pasul următor: publică primul tău anunț de angajare pentru a atrage candidați!
    </p>
  `;

  await sendResendEmail({
    to: [to],
    subject: `Compania „${c.name as string}" a fost creată cu succes!`,
    html: buildEmail({
      preheader: `${c.name as string} este acum listată pe platformă. Publică primul anunț!`,
      heading: `Bun venit, ${c.name as string}!`,
      bodyHtml,
      ctaUrl: dashboardUrl,
      ctaLabel: "Publică primul anunț",
      siteUrl,
      siteName,
    }),
    idempotencyKey: `company-created/${companyId}`,
  });
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const siteUrl = (
    Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  const siteName = Deno.env.get("SITE_NAME") ?? "LegalJobs";

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: EmailEvent;
  try {
    body = (await req.json()) as EmailEvent;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    switch (body.event) {
      case "application_notification":
        if (!body.job_id || typeof body.job_id !== "string") {
          return new Response(
            JSON.stringify({ error: "job_id required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        await handleApplicationNotification(
          supabase,
          user.id,
          user.email,
          // deno-lint-ignore no-explicit-any
          (user.user_metadata ?? {}) as Record<string, any>,
          body.job_id,
          siteUrl,
          siteName
        );
        break;

      case "profile_updated":
        await handleProfileUpdated(
          supabase,
          user.id,
          user.email,
          siteUrl,
          siteName
        );
        break;

      case "company_created":
        if (!body.company_id || typeof body.company_id !== "string") {
          return new Response(
            JSON.stringify({ error: "company_id required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        await handleCompanyCreated(
          supabase,
          user.id,
          user.email,
          // deno-lint-ignore no-explicit-any
          (user.user_metadata ?? {}) as Record<string, any>,
          body.company_id,
          siteUrl,
          siteName
        );
        break;

      default:
        return new Response(JSON.stringify({ error: "Unknown event" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    console.error("send-email error:", err);
    // Return 200 so callers can fire-and-forget without unhandled rejections.
    return new Response(
      JSON.stringify({ ok: true, emailsSent: false, error: String(err) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ ok: true, emailsSent: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
