import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

export const getCompanyBySlug = async (
  supabase: SupabaseClient<Database>,
  slug: string
) => {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data;
};

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
    .select("role, companies(*, job_listings(count))")
    .eq("user_id", userId)
    .not("accepted_at", "is", null);

  if (error) throw error;

  return (data ?? []).flatMap((row) => {
    if (!row.companies) return [];
    const company = row.companies as Tables<"companies"> & {
      job_listings: { count: number }[];
    };
    if (!includeArchived && company.is_archived) return [];
    return [{
      ...company,
      role: row.role,
      jobCount: company.job_listings?.[0]?.count ?? 0,
    }];
  });
};

export const getCompanyMembers = async (
  supabase: SupabaseClient<Database>,
  companyId: string
) => {
  const { data, error } = await supabase
    .from("company_users")
    .select("*, profiles:user_id(id, full_name, avatar_url, slug)")
    .eq("company_id", companyId);

  if (error) throw error;
  return data ?? [];
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

export const inviteMember = async (
  supabase: SupabaseClient<Database>,
  companyId: string,
  userId: string,
  role: "admin" | "member" = "member"
) => {
  const { error } = await supabase.from("company_users").insert({
    company_id: companyId,
    user_id: userId,
    role,
  });

  if (error) throw error;
};
