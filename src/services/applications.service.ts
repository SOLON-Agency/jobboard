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

export const getUserApplications = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<(Tables<"applications"> & { job_listings: Tables<"job_listings"> | null })[]> => {
  const { data, error } = await supabase
    .from("applications")
    .select("*, job_listings(*, companies(*))")
    .eq("user_id", userId)
    .order("applied_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const getJobApplications = async (
  supabase: SupabaseClient<Database>,
  jobId: string
) => {
  const { data, error } = await supabase
    .from("applications")
    .select("*, profiles:user_id(id, full_name, avatar_url, headline)")
    .eq("job_id", jobId)
    .order("applied_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
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
