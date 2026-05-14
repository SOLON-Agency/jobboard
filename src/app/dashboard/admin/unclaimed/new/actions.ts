"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdminRole } from "@/lib/server-guards";
import { createUnclaimedCompany, issueClaimToken } from "@/services/companies.service";
import { createJob } from "@/services/jobs.service";
import { slugify } from "@/lib/utils";
import type { UnclaimedCompanyFormData } from "@/components/forms/validations/company.schema";
import type { JobFormData } from "@/components/forms/validations/job.schema";

export interface CreateUnclaimedResult {
  ok: true;
  companyId: string;
  companyName: string;
  companyEmail: string;
  claimUrl: string;
  code: string;
}

export interface CreateUnclaimedError {
  ok: false;
  error: string;
}

export async function createUnclaimedAction(
  companyData: UnclaimedCompanyFormData,
  jobData: JobFormData,
): Promise<CreateUnclaimedResult | CreateUnclaimedError> {
  try {
    await requireAdminRole();
  } catch {
    return { ok: false, error: "Acces restricționat: rol de administrator necesar." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Autentificare necesară." };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

  try {
    // 1. Create the unclaimed company (no company_users row)
    const slug = slugify(companyData.name);
    const company = await createUnclaimedCompany(
      supabase,
      {
        name: companyData.name,
        description: companyData.description || null,
        email: companyData.email,
        website: companyData.website || null,
        industry: companyData.industry || null,
        size: companyData.size || null,
        location: companyData.location || null,
        founded_year: companyData.founded_year ? parseInt(companyData.founded_year, 10) : null,
        slug: `${slug}-${Date.now().toString(36)}`,
      },
      user.id,
    );

    // 2. Create the first job listing.
    // application_method is a UI-only concept — map it to the real DB columns:
    //   "url"  → application_url
    //   "form" → application_form_id
    //   "none" → both null
    const appUrl =
      jobData.application_method === "url" ? (jobData.application_url || null) : null;
    const appFormId =
      jobData.application_method === "form" ? (jobData.form_id || null) : null;

    const jobPublishedAt = new Date(jobData.published_at);
    const jobStatus = jobPublishedAt <= new Date() ? "published" : "draft";
    const jobSlug = `${slugify(jobData.title)}-${company.slug}-${Date.now().toString(36)}`;

    await createJob(supabase, {
      company_id: company.id,
      title: jobData.title,
      description: jobData.description,
      location: jobData.location || null,
      published_at: new Date(jobData.published_at).toISOString(),
      expires_at: new Date(jobData.expires_at).toISOString(),
      job_type: jobData.job_type || null,
      experience_level: jobData.experience_level.length > 0 ? jobData.experience_level : null,
      salary_min: jobData.salary_min ? parseFloat(jobData.salary_min) : null,
      salary_max: jobData.salary_max ? parseFloat(jobData.salary_max) : null,
      is_remote: jobData.is_remote,
      application_url: appUrl,
      application_form_id: appFormId,
      status: jobStatus,
      slug: jobSlug,
    });

    // 3. Issue the claim token
    const { code, token } = await issueClaimToken(supabase, company.id);
    const claimUrl = `${siteUrl}/claim?token=${token}`;

    // 4. Fire welcome email (non-blocking; do not let email failure block the response)
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    if (supabaseUrl && companyData.email) {
      void fetch(`${supabaseUrl}/functions/v1/notifications`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          to_email: companyData.email,
          to_name: companyData.name,
          channel: "email",
          subject: `${companyData.name}, candidați te caută chiar acum — preia controlul, e gratuit`,
          resend_template: {
            id: "unclaimed-company-welcome",
            variables: {
              companyName: companyData.name,
              claimUrl,
              code,
              siteUrl,
            },
          },
        }),
      }).catch((err: unknown) => console.warn("notifications welcome email:", err));
    }

    return {
      ok: true,
      companyId: company.id,
      companyName: company.name,
      companyEmail: companyData.email!,
      claimUrl,
      code,
    };
  } catch (err: unknown) {
    let message: string;
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "object" && err !== null && "message" in err) {
      message = String((err as { message: unknown }).message);
    } else {
      message = JSON.stringify(err);
    }
    console.error("createUnclaimedAction error:", message, err);
    return { ok: false, error: message };
  }
}
