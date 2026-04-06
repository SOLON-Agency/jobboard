import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildEmail,
  corsHeaders,
  detailRow,
  errResponse,
  getResendConfig,
  infoTable,
  okResponse,
  sendHtmlEmail,
} from "../_shared/email.ts";

interface NotifyPayload {
  company_id: string;
  user_id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { company_id, user_id }: NotifyPayload = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const siteUrl = Deno.env.get("SITE_URL") ?? supabaseUrl;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // ── Fetch user email ─────────────────────────────────────────────────────
    const { data: userData } = await supabase.auth.admin.getUserById(user_id);
    const userEmail = userData?.user?.email;
    if (!userEmail) return okResponse({ emailsSent: false, reason: "no email" });

    const userName =
      userData?.user?.user_metadata?.full_name ?? userEmail;

    // ── Fetch company details ────────────────────────────────────────────────
    const { data: company, error: companyErr } = await supabase
      .from("companies")
      .select("name, slug, description, industry, size, location, website, founded_year")
      .eq("id", company_id)
      .single();
    if (companyErr) throw companyErr;

    const companyPublicUrl = company.slug
      ? `${siteUrl}/companies/${company.slug}`
      : siteUrl;
    const dashboardUrl = `${siteUrl}/dashboard/company`;

    const createdAt = new Date().toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // ── Resend ───────────────────────────────────────────────────────────────
    const mail = getResendConfig();
    if (!mail) {
      console.warn("Resend not configured (RESEND_API_KEY + RESEND_FROM) — skipping company created email.");
      return okResponse({ emailsSent: false });
    }

    // ── Build detail rows ────────────────────────────────────────────────────
    const rows = [
      detailRow("Nume companie:", company.name),
      ...(company.industry ? [detailRow("Industrie:", company.industry)] : []),
      ...(company.size ? [detailRow("Dimensiune:", company.size)] : []),
      ...(company.location ? [detailRow("Locație:", company.location)] : []),
      ...(company.website
        ? [detailRow("Website:", `<a href="${company.website}" style="color:#03170C;">${company.website}</a>`)]
        : []),
      ...(company.founded_year
        ? [detailRow("Fondată în:", String(company.founded_year))]
        : []),
      detailRow("Creată la:", createdAt),
    ].join("");

    const bodyHtml = `
      <p>Salut, ${userName},</p>
      <p>
        Felicitări! Compania ta <strong>${company.name}</strong> a fost creată cu succes
        pe platforma noastră. Acum poți publica anunțuri de angajare și să găsești 
        candidații potriviți.
      </p>
      ${infoTable(rows)}
      ${
        company.description
          ? `<p style="margin-top:16px;font-size:13px;color:#6B7C70;">
               <strong>Descriere:</strong><br/>
               ${company.description.slice(0, 300)}${company.description.length > 300 ? "…" : ""}
             </p>`
          : ""
      }
      <p>
        Pasul următor: publică primul tău anunț de angajare pentru a atrage candidați!
      </p>
    `;

    await sendHtmlEmail(mail, {
      to: userEmail,
      subject: `Compania „${company.name}" a fost creată cu succes!`,
      html: buildEmail({
        preheader: `${company.name} este acum listată pe platformă. Publică primul anunț!`,
        heading: `Bun venit, ${company.name}!`,
        bodyHtml,
        ctaUrl: dashboardUrl,
        ctaLabel: "Publică primul anunț",
        siteUrl,
      }),
    });

    return okResponse({ emailsSent: true });
  } catch (err) {
    console.error("notify-company-created error:", err);
    return errResponse(err);
  }
});
