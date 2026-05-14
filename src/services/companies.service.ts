import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

export const getCompanyWithJobs = async (
  supabase: SupabaseClient<Database>,
  slug: string
) => {
  const { data: company, error } = await supabase
    .from("companies")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) throw error;

  const [publishedResult, totalResult] = await Promise.all([
    supabase
      .from("job_listings")
      .select("*")
      .eq("company_id", company.id)
      .eq("status", "published")
      .eq("is_archived", false)
      .order("published_at", { ascending: false }),
    supabase
      .from("job_listings")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company.id)
      .eq("is_archived", false),
  ]);

  return {
    company,
    jobs: publishedResult.data ?? [],
    totalJobCount: totalResult.count ?? 0,
  };
};

export const getAllCompanySlugs = async (
  supabase: SupabaseClient<Database>
) => {
  const { data, error } = await supabase.from("companies").select("slug");
  if (error) throw error;
  return data?.map((c) => c.slug) ?? [];
};

export const createCompany = async (
  supabase: SupabaseClient<Database>,
  company: Database["public"]["Tables"]["companies"]["Insert"],
  userId: string
) => {
  const { data, error } = await supabase
    .from("companies")
    .insert(company)
    .select()
    .single();

  if (error) throw error;

  await supabase.from("company_users").insert({
    company_id: data.id,
    user_id: userId,
    role: "owner",
    accepted_at: new Date().toISOString(),
  });

  return data;
};

export const updateCompany = async (
  supabase: SupabaseClient<Database>,
  id: string,
  updates: Database["public"]["Tables"]["companies"]["Update"]
) => {
  const { data, error } = await supabase
    .from("companies")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserCompanies = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  onlyActive: boolean = true,
): Promise<(Tables<"company_users"> & { companies: Tables<"companies"> | null })[]> => {
  const { data, error } = await supabase
    .from("company_users")
    .select("*, companies(*)")
    .eq("user_id", userId)
    .not("accepted_at", "is", null)
    .eq("companies.is_archived", onlyActive ? false : true);

  if (error) throw error;
  return data ?? [];
};

export type CompanyWithJobCount = Tables<"companies"> & {
  role: Database["public"]["Enums"]["company_role"];
  jobCount: number;
};

export const archiveCompany = async (
  supabase: SupabaseClient<Database>,
  id: string,
  archived: boolean
): Promise<void> => {
  const { error } = await supabase
    .from("companies")
    .update({
      is_archived: archived,
      archived_at: archived ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw error;
};

export const getArchivedCompanies = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<(Tables<"companies"> & { role: Database["public"]["Enums"]["company_role"] })[]> => {
  const { data, error } = await supabase
    .from("company_users")
    .select("role, companies(*)")
    .eq("user_id", userId)
    .not("accepted_at", "is", null);

  if (error) throw error;

  return (data ?? []).flatMap((row) => {
    if (!row.companies) return [];
    const company = row.companies as Tables<"companies">;
    if (!company.is_archived) return [];
    return [{ ...company, role: row.role }];
  });
};

export const getUserCompaniesWithJobCount = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  includeArchived = false
): Promise<CompanyWithJobCount[]> => {
  const { data, error } = await supabase
    .from("company_users")
    .select("role, companies(*)")
    .eq("user_id", userId)
    .not("accepted_at", "is", null);

  if (error) throw error;

  const companies = (data ?? []).flatMap((row) => {
    if (!row.companies) return [];
    const company = row.companies as Tables<"companies">;
    if (!includeArchived && company.is_archived) return [];
    return [{ ...company, role: row.role }];
  });

  if (companies.length === 0) return [];

  // Fetch only active (published + not archived) job listings in one batch query
  // so the badge reflects real open positions, not total historical count.
  const { data: activeJobs } = await supabase
    .from("job_listings")
    .select("company_id")
    .in("company_id", companies.map((c) => c.id))
    .eq("status", "published")
    .eq("is_archived", false);

  const countByCompany = (activeJobs ?? []).reduce<Record<string, number>>((acc, j) => {
    acc[j.company_id] = (acc[j.company_id] ?? 0) + 1;
    return acc;
  }, {});

  return companies.map((c) => ({ ...c, jobCount: countByCompany[c.id] ?? 0 }));
};

export const trackCompanyVisit = async (
  supabase: SupabaseClient<Database>,
  companyId: string
): Promise<void> => {
  await supabase.rpc("increment_company_visits", { p_company_id: companyId });
};

export const trackCompanyEngage = async (
  supabase: SupabaseClient<Database>,
  companyId: string
): Promise<void> => {
  await supabase.rpc("increment_company_engages", { p_company_id: companyId });
};

// ─── Unclaimed company helpers ────────────────────────────────────────────────

export interface UnclaimedCompanyRow {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  created_at: string;
  jobCount: number;
  /** ISO string of the most recently published job, or null if none. */
  latestJobPublishedAt: string | null;
}

/**
 * Returns all unclaimed companies with job counts, ordered newest first.
 *
 * RLS: admin-only (enforce at the page level via requireAdminRole).
 */
export const getUnclaimedCompanies = async (
  supabase: SupabaseClient<Database>
): Promise<UnclaimedCompanyRow[]> => {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, slug, email, created_at")
    .eq("is_claimed", false)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message ?? JSON.stringify(error));
  if (!data || data.length === 0) return [];

  const ids = data.map((c) => c.id);

  const { data: jobs } = await supabase
    .from("job_listings")
    .select("company_id, published_at")
    .in("company_id", ids)
    .eq("is_archived", false);

  const countMap: Record<string, number> = {};
  const latestMap: Record<string, string | null> = {};

  for (const job of jobs ?? []) {
    countMap[job.company_id] = (countMap[job.company_id] ?? 0) + 1;
    const prev = latestMap[job.company_id];
    if (job.published_at && (!prev || job.published_at > prev)) {
      latestMap[job.company_id] = job.published_at;
    }
  }

  return data.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    email: c.email,
    created_at: c.created_at,
    jobCount: countMap[c.id] ?? 0,
    latestJobPublishedAt: latestMap[c.id] ?? null,
  }));
};

/**
 * Creates a company that is NOT yet owned by any registered user.
 * Inserts the admin as a company member so that the subsequent job_listings INSERT
 * passes RLS (which requires company membership). The company is still "unclaimed"
 * (is_claimed=false) — the admin's membership is how the platform manages it until
 * a real owner claims it. claim_company transfers ownership to the claimer.
 *
 * RLS: requires the caller to be an admin (enforce at the page level via requireAdminRole).
 */
export const createUnclaimedCompany = async (
  supabase: SupabaseClient<Database>,
  company: Database["public"]["Tables"]["companies"]["Insert"],
  adminId: string
): Promise<Tables<"companies">> => {
  const { data, error } = await supabase
    .from("companies")
    .insert({ ...company, is_claimed: false, created_by: adminId })
    .select()
    .single();

  if (error) throw new Error(error.message ?? JSON.stringify(error));

  // Add the admin to company_users so RLS on job_listings is satisfied.
  // role="owner" matches the existing createCompany pattern; claim_company will
  // upsert the real claimer as owner when they claim.
  const { error: cuError } = await supabase.from("company_users").insert({
    company_id: data.id,
    user_id: adminId,
    role: "owner",
    accepted_at: new Date().toISOString(),
  });

  if (cuError) throw new Error(cuError.message ?? JSON.stringify(cuError));

  return data;
};

/**
 * Issues (or rotates) a claim token for an unclaimed company.
 * Returns the plaintext 6-digit code (shown once) and the opaque UUID token
 * (embedded in the magic-link URL).
 *
 * RLS: SECURITY DEFINER — admin role is validated inside the function.
 */
export const issueClaimToken = async (
  supabase: SupabaseClient<Database>,
  companyId: string
): Promise<{ code: string; token: string }> => {
  const { data, error } = await supabase.rpc("issue_company_claim_token", {
    p_company_id: companyId,
  });

  if (error) throw new Error(error.message ?? JSON.stringify(error));
  const row = data?.[0];
  if (!row) throw new Error("issue_company_claim_token returned no data");
  return { code: row.code, token: row.token };
};

/**
 * Completes the company claim for the authenticated user.
 * Verifies the code, consumes the token, transfers ownership and job_listings.
 * Returns the company_id and slug.
 *
 * RLS: SECURITY DEFINER — auth.uid() must not be null.
 */
export const claimCompany = async (
  supabase: SupabaseClient<Database>,
  params: { token: string; code: string }
): Promise<{ company_id: string; slug: string }> => {
  const { data, error } = await supabase.rpc("claim_company", {
    p_token: params.token,
    p_code: params.code,
  });

  if (error) throw new Error(error.message ?? JSON.stringify(error));
  const row = data?.[0];
  if (!row) throw new Error("claim_company returned no data");
  return { company_id: row.company_id, slug: row.slug };
};

