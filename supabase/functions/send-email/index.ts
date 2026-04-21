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
 *   "profile_updated"           — profile-update confirmation to the user
 *   "company_created"           — company-creation welcome email
 *   "custom_email"              — ad-hoc HTML email (body plain text → escaped + line breaks);
 *                                 recipient must match the authenticated user's email (anti-abuse)
 *
 * Job-application emails use the `job-application` Edge Function (Resend templates via `notifications`).
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { buildEmail, detailRow, infoTable } from "../_shared/email-templates.ts";
import { sendResendEmail } from "../_shared/resend.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmailEvent =
  | { event: "profile_updated" }
  | { event: "company_created"; company_id: string }
  | { event: "custom_email"; to: string; subject: string; body: string };

function escapeHtmlPlainText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function handleCustomEmail(
  userEmail: string | undefined,
  toRaw: string,
  subjectRaw: string,
  bodyRaw: string,
  siteUrl: string,
  siteName: string
): Promise<void> {
  const to = toRaw.trim();
  const subject = subjectRaw.trim();
  const body = bodyRaw.trim();
  if (!to || !subject || !body) {
    throw new Error("Câmpurile to, subject și body sunt obligatorii.");
  }

  const normalizedUser = userEmail?.trim().toLowerCase() ?? "";
  const normalizedTo = to.toLowerCase();
  if (!normalizedUser || normalizedTo !== normalizedUser) {
    throw new Error(
      "Poți trimite doar către adresa de e-mail a contului tău autentificat."
    );
  }

  const bodyHtml = escapeHtmlPlainText(body)
    .replace(/\r\n/g, "\n")
    .split("\n")
    .join("<br/>");

  await sendResendEmail({
    to: [to],
    subject,
    html: buildEmail({
      preheader: subject.length > 120 ? `${subject.slice(0, 117)}…` : subject,
      heading: "E-mail de test",
      bodyHtml: `<p style="margin:0;font-size:15px;line-height:1.6;">${bodyHtml}</p>`,
      ctaUrl: siteUrl,
      ctaLabel: "Deschide site-ul",
      siteUrl,
      siteName,
    }),
  });
}

// ─── Label maps ───────────────────────────────────────────────────────────────

const EXPERIENCE_LABEL: Record<string, string> = {
  entry: "Entry-level",
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  lead: "Lead / Principal",
};

// ─── Email handlers ───────────────────────────────────────────────────────────

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

      case "custom_email": {
        if (
          typeof body.to !== "string" ||
          typeof body.subject !== "string" ||
          typeof body.body !== "string"
        ) {
          return new Response(
            JSON.stringify({ error: "to, subject și body trebuie să fie stringuri" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        await handleCustomEmail(
          user.email,
          body.to,
          body.subject,
          body.body,
          siteUrl,
          siteName
        );
        break;
      }

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
