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

