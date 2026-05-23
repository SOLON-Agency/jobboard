import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type FaqPageTab = "home" | "how_it_works";

/** Stored on `public.faq.placement`; `both` renders on home and how-it-works. */
export type FaqPlacement = FaqPageTab | "both";

function placementFilterOr(page: FaqPageTab): string {
  return page === "home"
    ? "placement.eq.home,placement.eq.both"
    : "placement.eq.how_it_works,placement.eq.both";
}

export interface FaqPublicItem {
  question: string;
  answer: string;
}

/**
 * Active FAQ rows for a marketing page, ordered for display.
 * Includes rows with `placement = 'both'`.
 * RLS: anon sees rows where is_active = true.
 */
export async function getPublishedFaqs(
  supabase: SupabaseClient<Database>,
  page: FaqPageTab
): Promise<FaqPublicItem[]> {
  const { data, error } = await supabase
    .from("faq")
    .select("question, answer")
    .or(placementFilterOr(page))
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    question: row.question,
    answer: row.answer,
  }));
}

/**
 * FAQ rows for admin list on the given tab (home-only + both, or hiw-only + both).
 */
export async function listFaqsForAdmin(
  supabase: SupabaseClient<Database>,
  tab: FaqPageTab
): Promise<Tables<"faq">[]> {
  const { data, error } = await supabase
    .from("faq")
    .select("*")
    .or(placementFilterOr(tab))
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createFaqRow(supabase: SupabaseClient<Database>, row: TablesInsert<"faq">) {
  const { error } = await supabase.from("faq").insert(row);
  if (error) throw error;
}

export async function updateFaqRow(
  supabase: SupabaseClient<Database>,
  id: string,
  patch: TablesUpdate<"faq">
) {
  const { error } = await supabase.from("faq").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteFaqRow(supabase: SupabaseClient<Database>, id: string) {
  const { error } = await supabase.from("faq").delete().eq("id", id);
  if (error) throw error;
}
