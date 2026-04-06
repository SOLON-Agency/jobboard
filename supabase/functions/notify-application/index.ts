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
  job_id: string;
  applicant_user_id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { job_id, applicant_user_id }: NotifyPayload = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const siteUrl = Deno.env.get("SITE_URL") ?? supabaseUrl;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // ── Fetch job + company ──────────────────────────────────────────────────
    const { data: job, error: jobErr } = await supabase
      .from("job_listings")
      .select(`
        id, title, slug, location, job_type, salary_min, salary_max,
        company_id,
        companies ( name, slug, logo_url, location )
      `)
      .eq("id", job_id)
      .single();
    if (jobErr) throw jobErr;

    const company = (job.companies as {
      name: string;
      slug: string | null;
      logo_url: string | null;
      location: string | null;
    } | null);
    const companyName = company?.name ?? "Compania";
    const companyUrl = company?.slug
      ? `${siteUrl}/companies/${company.slug}`
      : siteUrl;
    const jobUrl = `${siteUrl}/jobs/${job.slug}`;
    const appliedAt = new Date().toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // ── Fetch job poster (first owner of company) ────────────────────────────
    const { data: companyUsers } = await supabase
      .from("company_users")
      .select("user_id")
      .eq("company_id", job.company_id)
      .limit(1);

    let posterEmail: string | null = null;
    let posterName = "Angajator";
    if (companyUsers && companyUsers.length > 0) {
      const { data: posterData } = await supabase.auth.admin.getUserById(
        companyUsers[0].user_id
      );
      posterEmail = posterData?.user?.email ?? null;
      posterName =
        posterData?.user?.user_metadata?.full_name ??
        posterEmail ??
        "Angajator";
    }

    // ── Fetch applicant details ──────────────────────────────────────────────
    const { data: applicantData } = await supabase.auth.admin.getUserById(
      applicant_user_id
    );
    const applicantEmail = applicantData?.user?.email ?? null;
    const applicantName =
      applicantData?.user?.user_metadata?.full_name ??
      applicantEmail ??
      "Candidatul";

    // Fetch public profile for CV / headline
    const { data: applicantProfile } = await supabase
      .from("profiles")
      .select("full_name, headline, location, slug, is_public, cv_url")
      .eq("id", applicant_user_id)
      .single();

    const publicProfileUrl =
      applicantProfile?.is_public && applicantProfile?.slug
        ? `${siteUrl}/users/${applicantProfile.slug}`
        : null;

    // ── Resend ───────────────────────────────────────────────────────────────
    const mail = getResendConfig();
    if (!mail) {
      console.warn("Resend not configured (RESEND_API_KEY + RESEND_FROM) — skipping emails.");
      return okResponse({ emailsSent: false });
    }

    // ── Email 1: job poster ──────────────────────────────────────────────────
    if (posterEmail) {
      const posterRows = [
        detailRow("Candidat:", applicantName),
        ...(applicantProfile?.headline
          ? [detailRow("Poziție dorită:", applicantProfile.headline)]
          : []),
        ...(applicantProfile?.location
          ? [detailRow("Locație:", applicantProfile.location)]
          : []),
        detailRow("Data aplicării:", appliedAt),
        detailRow("Post:", job.title),
        detailRow("Companie:", companyName),
      ].join("");

      const posterBody = `
        <p>Salut, ${posterName},</p>
        <p>
          Anunțul tău <strong>${job.title}</strong> la <strong>${companyName}</strong>
          a primit o candidatură nouă de la <strong>${applicantName}</strong>.
        </p>
        ${infoTable(posterRows)}
        ${
          publicProfileUrl
            ? `<p>Poți vizualiza profilul candidatului pentru mai multe detalii.</p>`
            : ""
        }
      `;

      await sendHtmlEmail(mail, {
        to: posterEmail,
        subject: `Candidatură nouă pentru „${job.title}"`,
        html: buildEmail({
          preheader: `${applicantName} a aplicat la postul ${job.title}`,
          heading: "Ai primit o candidatură nouă! 🎉",
          bodyHtml: posterBody,
          ctaUrl: publicProfileUrl ?? `${siteUrl}/dashboard/applications`,
          ctaLabel: publicProfileUrl ? "Vezi profilul candidatului" : "Vezi candidaturile",
          siteUrl,
        }),
      });
    }

    // ── Email 2: candidate confirmation ──────────────────────────────────────
    if (applicantEmail) {
      const jobTypeLabel: Record<string, string> = {
        fulltime: "Full-time",
        parttime: "Part-time",
        internship: "Internship",
        freelance: "Freelance",
        volunteer: "Voluntariat",
      };

      const salaryText =
        job.salary_min && job.salary_max
          ? `${job.salary_min.toLocaleString("ro-RO")} – ${job.salary_max.toLocaleString("ro-RO")} RON`
          : job.salary_min
          ? `De la ${job.salary_min.toLocaleString("ro-RO")} RON`
          : null;

      const candidateRows = [
        detailRow("Post:", job.title),
        detailRow("Companie:", companyName),
        ...(job.location ? [detailRow("Locație:", job.location)] : []),
        ...(job.job_type
          ? [detailRow("Tip:", jobTypeLabel[job.job_type] ?? job.job_type)]
          : []),
        ...(salaryText ? [detailRow("Salariu:", salaryText)] : []),
        detailRow("Data aplicării:", appliedAt),
      ].join("");

      const candidateBody = `
        <p>Salut, ${applicantName},</p>
        <p>
          Îți mulțumim pentru candidatura ta! Am înregistrat cu succes
          aplicația ta pentru postul <strong>${job.title}</strong> la 
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
        subject: `Candidatura ta pentru „${job.title}" a fost trimisă!`,
        html: buildEmail({
          preheader: `Aplicația ta la ${companyName} a fost înregistrată cu succes.`,
          heading: "Candidatură înregistrată cu succes!",
          bodyHtml: candidateBody,
          ctaUrl: jobUrl,
          ctaLabel: "Vezi anunțul",
          siteUrl,
        }),
      });
    }

    return okResponse({ emailsSent: true });
  } catch (err) {
    console.error("notify-application error:", err);
    return errResponse(err);
  }
});
