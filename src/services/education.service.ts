import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

export type EducationItem = Tables<"profile_education">;

export const getEducationItems = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<EducationItem[]> => {
  const { data, error } = await supabase
    .from("profile_education")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const getPublicEducationItems = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<EducationItem[]> => {
  const { data, error } = await supabase
    .from("profile_education")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const createEducationItem = async (
  supabase: SupabaseClient<Database>,
  item: Database["public"]["Tables"]["profile_education"]["Insert"]
): Promise<EducationItem> => {
  const { data, error } = await supabase
    .from("profile_education")
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateEducationItem = async (
  supabase: SupabaseClient<Database>,
  id: string,
  updates: Database["public"]["Tables"]["profile_education"]["Update"]
): Promise<EducationItem> => {
  const { data, error } = await supabase
    .from("profile_education")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteEducationItem = async (
  supabase: SupabaseClient<Database>,
  id: string
): Promise<void> => {
  const { error } = await supabase
    .from("profile_education")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

export const reorderEducationItems = async (
  supabase: SupabaseClient<Database>,
  items: { id: string; sort_order: number }[]
): Promise<void> => {
  await Promise.all(
    items.map(({ id, sort_order }) =>
      supabase
        .from("profile_education")
        .update({ sort_order })
        .eq("id", id)
    )
  );
};
