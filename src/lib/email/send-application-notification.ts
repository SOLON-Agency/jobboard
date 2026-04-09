import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";
import appSettings from "@/config/app.settings.json";
import {
  buildEmail,
  detailRow,
  getResendConfig,
  infoTable,
  sendHtmlEmail,
} from "@/lib/email/resend";

type JobRow = Tables<"job_listings"> & {
  companies: Pick<
    Tables<"companies">,
    "name" | "slug" | "logo_url" | "location"
  > | null;
};

const jobTypeLabel: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
};

/**
 * Sends “new application” emails using the caller’s Supabase session (RLS + RPC).
 * Requires RESEND_* env vars on the Next.js server.
 */
export const sendApplicationNotificationEmails = async (
  supabase: SupabaseClient<Database>,
  user: User,
  jobId: string,
  siteUrl: string
): Promise<{ emailsSent: boolean }> => {
  const mail = getResendConfig();
  if (!mail) {
    console.warn(
      "Resend not configured (RESEND_API_KEY + RESEND_FROM) — skipping application emails."
    );
    return { emailsSent: false };
  }

  const { data: appRow, error: appErr } = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (appErr) throw appErr;
  if (!appRow) {
    throw new Error("No application found for this job");
  }

  const { data: job, error: jobErr } = await supabase
    .from("job_listings")
    .select(
      `
        id, title, slug, location, job_type, salary_min, salary_max,
        company_id,
        companies ( name, slug, logo_url, location )
      `
    )
    .eq("id", jobId)
    .single();

  if (jobErr) throw jobErr;
  const j = job as JobRow;

  const company = j.companies;
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

  const poster = posterRows?.[0];
  const posterEmail = poster?.poster_email ?? null;
  const posterName = poster?.poster_name ?? "Angajator";

  const applicantEmail = user.email ?? null;
  const applicantName =
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null) ??
    applicantEmail ??
    "Candidatul";

  const { data: applicantProfile } = await supabase
    .from("profiles")
    .select("full_name, headline, location, slug, is_public, cv_url")
    .eq("id", user.id)
    .maybeSingle();

  const publicProfileUrl =
    applicantProfile?.is_public && applicantProfile?.slug
      ? `${siteUrl}/users/${applicantProfile.slug}`
      : null;

  if (posterEmail) {
    const posterTableRows = [
      detailRow("Candidat:", applicantName),
      ...(applicantProfile?.headline
        ? [detailRow("Poziție dorită:", applicantProfile.headline)]
        : []),
      ...(applicantProfile?.location
        ? [detailRow("Locație:", applicantProfile.location)]
        : []),
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
        ${
          publicProfileUrl
            ? `<p>Poți vizualiza profilul candidatului pentru mai multe detalii.</p>`
            : ""
        }
      `;

    await sendHtmlEmail(mail, {
      to: posterEmail,
      subject: `Candidatură nouă pentru „${j.title}"`,
      html: buildEmail({
        preheader: `${applicantName} a aplicat la postul ${j.title}`,
        heading: "Ai primit o candidatură nouă! 🎉",
        bodyHtml: posterBody,
        ctaUrl: publicProfileUrl ?? `${siteUrl}/dashboard/applications`,
        ctaLabel: publicProfileUrl ? "Vezi profilul candidatului" : "Vezi candidaturile",
        siteUrl,
        siteName: appSettings.name,
      }),
    });
  }

  if (applicantEmail) {
    const salaryText =
      j.salary_min && j.salary_max
        ? `${j.salary_min.toLocaleString("ro-RO")} – ${j.salary_max.toLocaleString("ro-RO")} RON`
        : j.salary_min
          ? `De la ${j.salary_min.toLocaleString("ro-RO")} RON`
          : null;

    const candidateRows = [
      detailRow("Post:", j.title),
      detailRow("Companie:", companyName),
      ...(j.location ? [detailRow("Locație:", j.location)] : []),
      ...(j.job_type
        ? [detailRow("Tip:", jobTypeLabel[j.job_type] ?? j.job_type)]
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

    await sendHtmlEmail(mail, {
      to: applicantEmail,
      subject: `Candidatura ta pentru „${j.title}" a fost trimisă!`,
      html: buildEmail({
        preheader: `Aplicația ta la ${companyName} a fost înregistrată cu succes.`,
        heading: "Candidatură înregistrată cu succes!",
        bodyHtml: candidateBody,
        ctaUrl: jobUrl,
        ctaLabel: "Vezi anunțul",
        siteUrl,
        siteName: appSettings.name,
      }),
    });
  }

  return { emailsSent: true };
};
