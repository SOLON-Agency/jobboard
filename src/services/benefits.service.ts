import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

export type BenefitItem = Tables<"job_benefits">;

export const getJobBenefits = async (
  supabase: SupabaseClient<Database>,
  jobId: string
): Promise<BenefitItem[]> => {
  const { data, error } = await supabase
    .from("job_benefits")
    .select("*")
    .eq("job_id", jobId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const createBenefit = async (
  supabase: SupabaseClient<Database>,
  benefit: Database["public"]["Tables"]["job_benefits"]["Insert"]
): Promise<BenefitItem> => {
  const { data, error } = await supabase
    .from("job_benefits")
    .insert(benefit)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateBenefit = async (
  supabase: SupabaseClient<Database>,
  id: string,
  updates: Database["public"]["Tables"]["job_benefits"]["Update"]
): Promise<void> => {
  const { error } = await supabase
    .from("job_benefits")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
};

export const deleteBenefit = async (
  supabase: SupabaseClient<Database>,
  id: string
): Promise<void> => {
  const { error } = await supabase.from("job_benefits").delete().eq("id", id);
  if (error) throw error;
};

export const reorderBenefits = async (
  supabase: SupabaseClient<Database>,
  updates: { id: string; sort_order: number }[]
): Promise<void> => {
  await Promise.all(
    updates.map(({ id, sort_order }) =>
      supabase.from("job_benefits").update({ sort_order }).eq("id", id)
    )
  );
};
