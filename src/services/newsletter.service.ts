import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

export type NewsletterSubscriber = Tables<"newsletter_subscribers">;

/**
 * Returns the count of currently active newsletter subscribers.
 * RLS: requires admin role.
 */
export async function countActiveSubscribers(
  supabase: SupabaseClient<Database>
): Promise<number> {
  const { count, error } = await supabase
    .from("newsletter_subscribers")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  if (error) throw error;
  return count ?? 0;
}

/**
 * Lists all active subscribers for admin use.
 * RLS: requires admin role.
 */
export async function listActiveSubscribers(
  supabase: SupabaseClient<Database>
): Promise<NewsletterSubscriber[]> {
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
