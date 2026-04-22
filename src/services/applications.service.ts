import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

export const submitApplication = async (
  supabase: SupabaseClient<Database>,
  application: Database["public"]["Tables"]["applications"]["Insert"]
) => {
  const { data, error } = await supabase
    .from("applications")
    .insert(application)
    .select()
    .single();

  if (error) throw error;
  return data;
};

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

export type JobApplicationCandidateProfile = Pick<
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
