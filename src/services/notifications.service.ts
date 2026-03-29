import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

export const createNotification = async (
  supabase: SupabaseClient<Database>,
  notification: {
    user_id: string;
    type: string;
    title: string;
    body?: string;
    data?: Json;
  }
) => {
  const { error } = await supabase.from("notifications").insert({
    user_id: notification.user_id,
    type: notification.type,
    title: notification.title,
    body: notification.body ?? null,
    data: notification.data ?? null,
  });
  if (error) throw error;
};

export const getUnreadCount = async (
  supabase: SupabaseClient<Database>,
  userId: string
) => {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) throw error;
  return count ?? 0;
};
