import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

export type UserApplication = Tables<"applications"> & {
  job_listings:
    | (Tables<"job_listings"> & { companies: Tables<"companies"> | null })
    | null;
};

export const getUserApplications = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserApplication[]> => {
  const { data, error } = await supabase
    .from("applications")
    .select("*, job_listings(*, companies(*))")
    .eq("user_id", userId)
    .eq("is_archived", false)
    .order("applied_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as UserApplication[];
};

export const withdrawApplication = async (
  supabase: SupabaseClient<Database>,
  id: string,
  reason: string
): Promise<Tables<"applications">> => {
  const { data, error } = await supabase
    .from("applications")
    .update({
      status: "withdrawn",
      withdraw_reason: reason,
      withdrawn_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const archiveApplication = async (
  supabase: SupabaseClient<Database>,
  id: string
): Promise<Tables<"applications">> => {
  const { data, error } = await supabase
    .from("applications")
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const restoreApplication = async (
  supabase: SupabaseClient<Database>,
  id: string
): Promise<Tables<"applications">> => {
  const { data, error } = await supabase
    .from("applications")
    .update({
      is_archived: false,
      archived_at: null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getArchivedApplications = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserApplication[]> => {
  const { data, error } = await supabase
    .from("applications")
    .select("*, job_listings(*, companies(*))")
    .eq("user_id", userId)
    .eq("is_archived", true)
    .order("archived_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as UserApplication[];
};

type JobApplicationCandidateProfile = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "avatar_url" | "headline"
>;

export type JobApplicationWithProfile = Tables<"applications"> & {
  profiles: JobApplicationCandidateProfile | null;
};

export const getJobApplications = async (
  supabase: SupabaseClient<Database>,
  jobId: string
): Promise<JobApplicationWithProfile[]> => {
  const { data: applications, error } = await supabase
    .from("applications")
    .select("*")
    .eq("job_id", jobId)
    .order("applied_at", { ascending: false });

  if (error) throw error;
  if (!applications || applications.length === 0) return [];

  const userIds = Array.from(new Set(applications.map((a) => a.user_id)));

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, headline")
    .in("id", userIds);

  if (profilesError) throw profilesError;

  const profileById = new Map<string, JobApplicationCandidateProfile>(
    (profiles ?? []).map((p) => [p.id, p])
  );

  return applications.map((a) => ({
    ...a,
    profiles: profileById.get(a.user_id) ?? null,
  }));
};

export const updateApplicationStatus = async (
  supabase: SupabaseClient<Database>,
  id: string,
  status: Database["public"]["Tables"]["applications"]["Update"]["status"]
) => {
  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Check whether a user has already applied to a specific job.
 * Returns `true` if an application row exists, `false` otherwise.
 *
 * @pattern ServiceQuery
 * @usedBy src/components/jobs/ApplyButton.tsx, src/app/api/jobs/apply-internal-form/route.ts
 * @example
 * ```ts
 * const applied = await hasApplied(supabase, jobId, user.id);
 * ```
 *
 * RLS: authenticated users can select their own applications (user_id = auth.uid()).
 */
export const hasApplied = async (
  supabase: SupabaseClient<Database>,
  jobId: string,
  userId: string
): Promise<boolean> => {
  const { data } = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("user_id", userId)
    .maybeSingle();

  return data !== null;
};

// ── Employer-wide candidates ───────────────────────────────────────────────────

export type EmployerCandidate = Tables<"applications"> & {
  profiles: Pick<Tables<"profiles">, "id" | "full_name" | "avatar_url" | "headline"> | null;
  job_listings: (Pick<Tables<"job_listings">, "id" | "title" | "slug"> & {
    companies: Pick<Tables<"companies">, "id" | "name" | "slug"> | null;
  }) | null;
};

/**
 * Fetch all applications across every job listing owned by this employer.
 * Returns an empty array if the employer has no companies or no job listings.
 */
export const getEmployerCandidates = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<EmployerCandidate[]> => {
  // 1. Resolve company IDs the user is a member of
  const { data: companyUsers, error: cuErr } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", userId)
    .not("accepted_at", "is", null);

  if (cuErr) throw cuErr;
  const companyIds = (companyUsers ?? []).map((cu) => cu.company_id);
  if (!companyIds.length) return [];

  // 2. Resolve job IDs for those companies
  const { data: jobRows, error: jErr } = await supabase
    .from("job_listings")
    .select("id")
    .in("company_id", companyIds);

  if (jErr) throw jErr;
  const jobIds = (jobRows ?? []).map((j) => j.id);
  if (!jobIds.length) return [];

  // 3. Fetch applications with joined job + company data
  //    (profiles cannot be joined via PostgREST because applications.user_id
  //    is a FK to auth.users, not public.profiles — fetch separately)
  const { data: apps, error } = await supabase
    .from("applications")
    .select(`
      *,
      job_listings!job_id(id, title, slug, companies!company_id(id, name, slug))
    `)
    .in("job_id", jobIds)
    .order("applied_at", { ascending: false });

  if (error) throw error;
  if (!apps || apps.length === 0) return [];

  // 4. Fetch profiles for the unique applicant user IDs
  const userIds = Array.from(new Set(apps.map((a) => a.user_id)));
  const { data: profileRows, error: pErr } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, headline")
    .in("id", userIds);

  if (pErr) throw pErr;

  type ProfileRow = Pick<Tables<"profiles">, "id" | "full_name" | "avatar_url" | "headline">;
  const profileById = new Map<string, ProfileRow>(
    (profileRows ?? []).map((p) => [p.id, p as ProfileRow])
  );

  // 5. Merge profiles into applications in JS
  return apps.map((a) => ({
    ...a,
    profiles: profileById.get(a.user_id) ?? null,
  })) as unknown as EmployerCandidate[];
};
