import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";
import appSettings from "@/config/app.settings.json";
import { buildEmail, detailRow, getResendConfig, infoTable, sendHtmlEmail } from "@/lib/email/resend";

export const sendCompanyCreatedEmail = async (
  supabase: SupabaseClient<Database>,
  user: User,
  companyId: string,
  siteUrl: string
): Promise<{ emailsSent: boolean }> => {
  const mail = getResendConfig();
  if (!mail) {
    console.warn(
      "Resend not configured (RESEND_API_KEY + RESEND_FROM) — skipping company-created email."
    );
    return { emailsSent: false };
  }

  const to = user.email?.trim();
  if (!to) return { emailsSent: false };

  const { data: membership, error: memErr } = await supabase
    .from("company_users")
    .select("user_id")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memErr) throw memErr;
  if (!membership) {
    throw new Error("Not a member of this company");
  }

  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .select(
      "name, slug, description, industry, size, location, website, founded_year"
    )
    .eq("id", companyId)
    .single();

  if (companyErr) throw companyErr;
  const c = company as Tables<"companies">;

  const userName =
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null) ?? to;

  const dashboardUrl = `${siteUrl}/dashboard/company`;
  const createdAt = new Date().toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const rows = [
    detailRow("Nume companie:", c.name),
    ...(c.industry ? [detailRow("Industrie:", c.industry)] : []),
    ...(c.size ? [detailRow("Dimensiune:", c.size)] : []),
    ...(c.location ? [detailRow("Locație:", c.location)] : []),
    ...(c.website
      ? [
          detailRow(
            "Website:",
            `<a href="${c.website}" style="color:#03170C;">${c.website}</a>`
          ),
        ]
      : []),
    ...(c.founded_year
      ? [detailRow("Fondată în:", String(c.founded_year))]
      : []),
    detailRow("Creată la:", createdAt),
  ].join("");

  const desc = c.description ?? "";
  const bodyHtml = `
      <p>Salut, ${userName},</p>
      <p>
        Felicitări! Compania ta <strong>${c.name}</strong> a fost creată cu succes
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

  await sendHtmlEmail(mail, {
    to,
    subject: `Compania „${c.name}" a fost creată cu succes!`,
    html: buildEmail({
      preheader: `${c.name} este acum listată pe platformă. Publică primul anunț!`,
      heading: `Bun venit, ${c.name}!`,
      bodyHtml,
      ctaUrl: dashboardUrl,
      ctaLabel: "Publică primul anunț",
      siteUrl,
      siteName: appSettings.name,
    }),
    idempotencyKey: `company-created/${companyId}`,
  });

  return { emailsSent: true };
};
