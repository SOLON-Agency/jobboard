import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

export type ExperienceItem = Tables<"profile_experience">;

export const getExperienceItems = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ExperienceItem[]> => {
  const { data, error } = await supabase
    .from("profile_experience")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const getPublicExperienceItems = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ExperienceItem[]> => {
  const { data, error } = await supabase
    .from("profile_experience")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const createExperienceItem = async (
  supabase: SupabaseClient<Database>,
  item: Database["public"]["Tables"]["profile_experience"]["Insert"]
): Promise<ExperienceItem> => {
  const { data, error } = await supabase
    .from("profile_experience")
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateExperienceItem = async (
  supabase: SupabaseClient<Database>,
  id: string,
  updates: Database["public"]["Tables"]["profile_experience"]["Update"]
): Promise<ExperienceItem> => {
  const { data, error } = await supabase
    .from("profile_experience")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteExperienceItem = async (
  supabase: SupabaseClient<Database>,
  id: string
): Promise<void> => {
  const { error } = await supabase
    .from("profile_experience")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

export const reorderExperienceItems = async (
  supabase: SupabaseClient<Database>,
  items: { id: string; sort_order: number }[]
): Promise<void> => {
  await Promise.all(
    items.map(({ id, sort_order }) =>
      supabase
        .from("profile_experience")
        .update({ sort_order })
        .eq("id", id)
    )
  );
};
