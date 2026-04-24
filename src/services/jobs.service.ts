import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";
import type { JobSearchFilters, PaginatedResponse } from "@/types";

export const getPublishedJobs = async (
  supabase: SupabaseClient<Database>,
  filters: JobSearchFilters & { page?: number; limit?: number }
): Promise<PaginatedResponse<Tables<"job_listings"> & { companies: Tables<"companies"> | null }>> => {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 12;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest:      { column: "published_at", ascending: false },
    oldest:      { column: "published_at", ascending: true },
    salary_high: { column: "salary_max",   ascending: false },
    salary_low:  { column: "salary_min",   ascending: true },
  };
  const { column, ascending } = sortMap[filters.sort ?? "newest"];

  const nowIso = new Date().toISOString();

  let query = supabase
    .from("job_listings")
    .select("*, companies(*)", { count: "exact" })
    .eq("status", "published")
    .eq("is_archived", false)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order(column, { ascending, nullsFirst: false })
    .range(from, to);

  if (filters.q) {
    query = query.textSearch("search_vector", filters.q, {
      type: "websearch",
    });
  }
  if (filters.location) {
    query = query.ilike("location", `%${filters.location}%`);
  }
  if (filters.type) {
    query = query.eq("job_type", filters.type);
  }
  if (filters.experience) {
    query = query.overlaps("experience_level", [filters.experience]);
  }
  if (filters.salaryMin) {
    query = query.gte("salary_min", filters.salaryMin);
  }
  if (filters.salaryMax) {
    query = query.lte("salary_max", filters.salaryMax);
  }
  if (filters.remote) {
    query = query.eq("is_remote", true);
  }
  if (filters.minBenefits && filters.minBenefits > 0) {
    query = query.gte("benefits_count", filters.minBenefits);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    data: data ?? [],
    count: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
};

export const getRelatedJobs = async (
  supabase: SupabaseClient<Database>,
  currentJobId: string,
  jobType: string | null,
  limit = 6
): Promise<(Tables<"job_listings"> & { companies: Tables<"companies"> | null })[]> => {
  let query = supabase
    .from("job_listings")
    .select("*, companies(*)")
    .eq("status", "published")
    .neq("id", currentJobId)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (jobType) query = query.eq("job_type", jobType);

  const { data } = await query;

  // If not enough same-type results, backfill with any published jobs
  if ((data?.length ?? 0) < limit) {
    const needed = limit - (data?.length ?? 0);
    const existingIds = [currentJobId, ...(data ?? []).map((j) => j.id)];
    const { data: extra } = await supabase
      .from("job_listings")
      .select("*, companies(*)")
      .eq("status", "published")
      .not("id", "in", `(${existingIds.join(",")})`)
      .order("published_at", { ascending: false })
      .limit(needed);
    return [...(data ?? []), ...(extra ?? [])] as (Tables<"job_listings"> & { companies: Tables<"companies"> | null })[];
  }

  return (data ?? []) as (Tables<"job_listings"> & { companies: Tables<"companies"> | null })[];
};

export const getJobBySlug = async (
  supabase: SupabaseClient<Database>,
  slug: string
) => {
  const { data, error } = await supabase
    .from("job_listings")
    .select("*, companies(*)")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data;
};

export const getAllJobSlugs = async (supabase: SupabaseClient<Database>) => {
  const { data, error } = await supabase
    .from("job_listings")
    .select("slug")
    .eq("status", "published");

  if (error) throw error;
  return data?.map((j) => j.slug) ?? [];
};

export const createJob = async (
  supabase: SupabaseClient<Database>,
  job: Database["public"]["Tables"]["job_listings"]["Insert"]
) => {
  const { data, error } = await supabase
    .from("job_listings")
    .insert(job)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateJob = async (
  supabase: SupabaseClient<Database>,
  id: string,
  updates: Database["public"]["Tables"]["job_listings"]["Update"]
) => {
  const { data, error } = await supabase
    .from("job_listings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteJob = async (
  supabase: SupabaseClient<Database>,
  id: string
) => {
  const { error } = await supabase.from("job_listings").delete().eq("id", id);
  if (error) throw error;
};

export const archiveJob = async (
  supabase: SupabaseClient<Database>,
  id: string,
  archived: boolean
): Promise<void> => {
  const { error } = await supabase
    .from("job_listings")
    .update({
      is_archived: archived,
      archived_at: archived ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw error;
};

export const getArchivedJobs = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<(Tables<"job_listings"> & { companies: Tables<"companies"> | null })[]> => {
  const { data: companyUsers } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", userId)
    .not("accepted_at", "is", null);

  if (!companyUsers?.length) return [];

  const companyIds = companyUsers.map((cu) => cu.company_id);

  const { data, error } = await supabase
    .from("job_listings")
    .select("*, companies(*)")
    .in("company_id", companyIds)
    .eq("is_archived", true)
    .order("archived_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as (Tables<"job_listings"> & { companies: Tables<"companies"> | null })[];
};

export const getCompanyJobs = async (
  supabase: SupabaseClient<Database>,
  companyId: string
) => {
  const { data, error } = await supabase
    .from("job_listings")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const toggleFavorite = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  jobId: string
) => {
  const { data: existing } = await supabase
    .from("favorites")
    .select()
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .single();

  if (existing) {
    await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("job_id", jobId);
    return false;
  }

  await supabase.from("favorites").insert({ user_id: userId, job_id: jobId });
  return true;
};

export const getUserFavorites = async (
  supabase: SupabaseClient<Database>,
  userId: string
) => {
  const { data, error } = await supabase
    .from("favorites")
    .select("job_id")
    .eq("user_id", userId);

  if (error) throw error;
  return new Set(data?.map((f) => f.job_id) ?? []);
};
