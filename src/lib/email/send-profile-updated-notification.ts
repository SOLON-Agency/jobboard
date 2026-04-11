import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import appSettings from "@/config/app.settings.json";
import { buildEmail, detailRow, getResendConfig, infoTable, sendHtmlEmail } from "@/lib/email/resend";

const experienceLevelLabel: Record<string, string> = {
  entry: "Entry-level",
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  lead: "Lead / Principal",
};

export const sendProfileUpdatedEmail = async (
  supabase: SupabaseClient<Database>,
  user: User,
  siteUrl: string
): Promise<{ emailsSent: boolean }> => {
  const mail = getResendConfig();
  if (!mail) {
    console.warn(
      "Resend not configured (RESEND_API_KEY + RESEND_FROM) — skipping profile email."
    );
    return { emailsSent: false };
  }

  const to = user.email?.trim();
  if (!to) return { emailsSent: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, headline, location, experience_level, is_public, slug")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile?.full_name ?? to;
  const updatedAt = new Date().toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const expLabel = profile?.experience_level
    ? experienceLevelLabel[profile.experience_level] ?? profile.experience_level
    : null;

  const rows = [
    detailRow("Nume:", name),
    ...(profile?.headline ? [detailRow("Titlu profesional:", profile.headline)] : []),
    ...(profile?.location ? [detailRow("Locație:", profile.location)] : []),
    ...(expLabel ? [detailRow("Nivel experiență:", expLabel)] : []),
    detailRow("Profil public:", profile?.is_public ? "Vizibil pentru toți" : "Ascuns"),
    detailRow("Actualizat la:", updatedAt),
  ].join("");

  const publicProfileUrl =
    profile?.is_public && profile?.slug
      ? `${siteUrl}/users/${profile.slug}`
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

  await sendHtmlEmail(mail, {
    to,
    subject: "Profilul tău a fost actualizat",
    html: buildEmail({
      preheader: "Modificările profilului tău au fost salvate cu succes.",
      heading: "Profil actualizat cu succes",
      bodyHtml,
      ctaUrl: publicProfileUrl,
      ctaLabel: profile?.is_public ? "Vezi profilul tău public" : "Mergi la profil",
      siteUrl,
      siteName: appSettings.name,
    }),
    idempotencyKey: `profile-updated/${user.id}/${Math.floor(Date.now() / 60_000)}`,
  });

  return { emailsSent: true };
};
