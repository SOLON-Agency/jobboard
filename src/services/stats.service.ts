import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface PublicCounts {
  jobs: number;
  companies: number;
  users: number;
}

/**
 * Fetch aggregate counts used on the public-facing homepage and how-it-works page.
 * Uses three parallel `count` queries (no row data returned — HEAD request).
 *
 * @pattern ServiceQuery
 * @usedBy src/app/page.tsx, src/app/(public)/how-it-works/page.tsx
 * @example
 * ```ts
 * const supabase = createStaticClient();
 * const counts = await getPublicCounts(supabase);
 * ```
 *
 * RLS: anon select is allowed on job_listings (status = published), companies, and profiles.
 */
export const getPublicCounts = async (
  supabase: SupabaseClient<Database>
): Promise<PublicCounts> => {
  const [{ count: jobs }, { count: companies }, { count: users }] =
    await Promise.all([
      supabase.from("job_listings").select("*", { count: "exact", head: true }).eq("status", "published").eq("is_archived", false),
      supabase.from("companies").select("*", { count: "exact", head: true }).eq("is_archived", false),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);

  return { jobs: jobs ?? 0, companies: companies ?? 0, users: users ?? 0 };
};

/**
 * Fetch the count of registered profiles (users).
 * Used on the how-it-works page to display "N+ avocați".
 *
 * @pattern ServiceQuery
 * @usedBy src/app/(public)/how-it-works/page.tsx
 *
 * RLS: anon select on profiles is allowed.
 */
export const getUserCount = async (supabase: SupabaseClient<Database>): Promise<number> => {
  const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
  return count ?? 0;
};
