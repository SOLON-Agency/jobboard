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

/**
 * Upload a profile avatar and return its public URL.
 *
 * RLS: authenticated users can upload to the avatars bucket.
 */
export const uploadAvatar = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  file: File
): Promise<string> => {
  const path = `${userId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Upload a CV and return its public URL.
 *
 * RLS: authenticated users can upload to the cvs bucket.
 */
export const uploadCv = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  file: File
): Promise<string> => {
  const path = `${userId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("cvs").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("cvs").getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Create a short-lived signed URL for downloading a CV from storage.
 * Accepts either a full public URL or a storage path within the cvs bucket.
 */
export const getCvSignedDownloadUrl = async (
  supabase: SupabaseClient<Database>,
  cvUrl: string,
  expiresInSeconds = 300
): Promise<string | null> => {
  const pathMatch = cvUrl.match(/\/storage\/v1\/object\/public\/cvs\/(.+)$/);
  const storagePath = pathMatch?.[1] ?? cvUrl;
  const { data, error } = await supabase.storage
    .from("cvs")
    .createSignedUrl(storagePath, expiresInSeconds, { download: true });

  if (error) throw error;
  return data?.signedUrl ?? null;
};
