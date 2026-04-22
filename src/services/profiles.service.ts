import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

/**
 * Fetch the full profile row for the currently authenticated user.
 *
 * @pattern ServiceQuery
 * @usedBy dashboard/profile/page.tsx, dashboard/page.tsx
 * @example
 * ```ts
 * const supabase = await createClient();
 * const profile = await getMyProfile(supabase, user.id);
 * ```
 *
 * RLS: authenticated users can select their own profile row (auth.uid() = id).
 */
export const getMyProfile = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Tables<"profiles"> | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
};

/**
 * Fetch the minimum avatar-related fields for the Navbar avatar display.
 * Avoids fetching the entire profile when only the avatar URL is needed.
 *
 * @pattern ServiceQuery
 * @usedBy src/components/layout/Navbar.tsx
 * @example
 * ```ts
 * const avatar = await getProfileAvatar(supabase, user.id);
 * ```
 *
 * RLS: authenticated users can select their own profile row.
 */
export const getProfileAvatar = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ avatar_url: string | null; full_name: string | null } | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("avatar_url, full_name")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
};

/**
 * Fetch a public user profile by slug for the public profile page.
 *
 * @pattern ServiceQuery
 * @usedBy src/app/(public)/users/[slug]/page.tsx
 *
 * RLS: anon select on profiles is allowed for public profiles (is_public = true).
 */
export const getPublicProfile = async (
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<Tables<"profiles"> | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
};

/**
 * Update profile fields for the currently authenticated user.
 *
 * @pattern ServiceMutation
 * @usedBy dashboard/profile/ProfileClient.tsx
 *
 * RLS: authenticated users can update their own profile row (auth.uid() = id).
 */
export const updateMyProfile = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  updates: Database["public"]["Tables"]["profiles"]["Update"]
): Promise<Tables<"profiles">> => {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
