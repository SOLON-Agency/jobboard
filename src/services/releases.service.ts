import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

export type ReleaseAnnouncement = Tables<"app_release_announcements">;

export const listReleaseAnnouncements = async (
  supabase: SupabaseClient<Database>
): Promise<ReleaseAnnouncement[]> => {
  const { data, error } = await supabase
    .from("app_release_announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const publishReleaseAnnouncement = async (
  supabase: SupabaseClient<Database>,
  releaseId: string
): Promise<void> => {
  const { error } = await supabase
    .from("app_release_announcements")
    .update({ draft: false, sent_at: new Date().toISOString() })
    .eq("id", releaseId);

  if (error) throw error;
};

export const listAllProfileIds = async (
  supabase: SupabaseClient<Database>
): Promise<string[]> => {
  const { data, error } = await supabase.from("profiles").select("id").not("id", "is", null);

  if (error) throw error;
  return (data ?? []).map((profile) => profile.id);
};

export const updateReleaseAnnouncement = async (
  supabase: SupabaseClient<Database>,
  releaseId: string,
  updates: Pick<ReleaseAnnouncement, "title" | "body_html">
): Promise<void> => {
  const { error } = await supabase
    .from("app_release_announcements")
    .update(updates)
    .eq("id", releaseId);

  if (error) throw error;
};
