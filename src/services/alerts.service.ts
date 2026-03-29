import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const getUserAlerts = async (
  supabase: SupabaseClient<Database>,
  userId: string
) => {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const createAlert = async (
  supabase: SupabaseClient<Database>,
  alert: Database["public"]["Tables"]["alerts"]["Insert"]
) => {
  const { data, error } = await supabase
    .from("alerts")
    .insert(alert)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateAlert = async (
  supabase: SupabaseClient<Database>,
  id: string,
  updates: Database["public"]["Tables"]["alerts"]["Update"]
) => {
  const { data, error } = await supabase
    .from("alerts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteAlert = async (
  supabase: SupabaseClient<Database>,
  id: string
) => {
  const { error } = await supabase.from("alerts").delete().eq("id", id);
  if (error) throw error;
};
