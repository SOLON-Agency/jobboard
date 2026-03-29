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

  const { data: jobs } = await supabase
    .from("job_listings")
    .select("*")
    .eq("company_id", company.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return { company, jobs: jobs ?? [] };
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
  userId: string
): Promise<(Tables<"company_users"> & { companies: Tables<"companies"> | null })[]> => {
  const { data, error } = await supabase
    .from("company_users")
    .select("*, companies(*)")
    .eq("user_id", userId)
    .not("accepted_at", "is", null);

  if (error) throw error;
  return data ?? [];
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
