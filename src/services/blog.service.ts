import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

export type BlogPost = Tables<"blog_posts">;

export interface BlogPostWithAuthor extends BlogPost {
  profiles: { full_name: string | null; avatar_url: string | null } | null;
}

export interface PaginatedBlogPosts {
  data: BlogPostWithAuthor[];
  count: number;
  page: number;
  totalPages: number;
}

/**
 * Lists published posts for the public index, ordered by published_at DESC.
 * RLS: anon can SELECT where status='published' AND published_at <= now().
 */
export async function listPublishedPosts(
  supabase: SupabaseClient<Database>,
  { page = 1, limit = 9, tag }: { page?: number; limit?: number; tag?: string }
): Promise<PaginatedBlogPosts> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("blog_posts")
    .select("*, profiles(full_name, avatar_url)", { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, to);

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    data: (data ?? []) as BlogPostWithAuthor[],
    count: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

/**
 * Fetches a single published post by slug.
 * RLS: anon can SELECT where status='published' AND published_at <= now().
 * Throws if the post is not found.
 */
export async function getPublishedPostBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<BlogPostWithAuthor> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*, profiles(full_name, avatar_url)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) throw error;
  return data as BlogPostWithAuthor;
}

/**
 * Returns all published slugs for generateStaticParams / sitemap.
 * RLS: anon can SELECT published posts only.
 */
export async function getAllPublishedSlugs(
  supabase: SupabaseClient<Database>
): Promise<string[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => r.slug);
}

/**
 * Lists all posts (all statuses) for the admin dashboard.
 * RLS: requires admin role.
 */
export async function listAllPostsAdmin(
  supabase: SupabaseClient<Database>,
  { status }: { status?: string } = {}
): Promise<BlogPost[]> {
  let query = supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/**
 * Fetches a single post by ID for the admin edit form.
 * RLS: requires admin role (can read drafts/archived).
 */
export async function getPostById(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<BlogPost> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Checks whether a slug is already taken.
 * Excludes the given post ID so editing keeps the same slug.
 * RLS: admin can see all statuses; public sees only published.
 */
export async function slugExists(
  supabase: SupabaseClient<Database>,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from("blog_posts")
    .select("id", { count: "exact", head: true })
    .eq("slug", slug);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { count, error } = await query;
  if (error) return false;
  return (count ?? 0) > 0;
}
