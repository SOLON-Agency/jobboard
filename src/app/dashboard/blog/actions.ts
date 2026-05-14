"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getServerRole } from "@/lib/roles";
import { assertFeatureEnabled } from "@/lib/feature-flags";
import { blogPostSchema, type BlogPostFormData } from "@/components/forms/validations/blog.schema";
import { readingTimeMinutes, autoExcerpt } from "@/lib/blog/markdown";

function requireAdmin(role: string): void {
  if (role !== "admin") throw new Error("Acces interzis: rol de administrator necesar");
}

function revalidateBlog(slug?: string) {
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
}

/**
 * Fires newsletter-notify edge function in the background when a post is
 * freshly published. Idempotent — the function checks notified_at internally.
 */
async function triggerNewsletterNotify(postId: string): Promise<void> {
  const supabase = await createClient();
  void supabase.functions
    .invoke("newsletter-notify", { body: { post_id: postId } })
    .catch((err: unknown) => console.warn("newsletter-notify:", err));
}

export interface BlogActionResult {
  ok: boolean;
  id?: string;
  slug?: string;
  error?: string;
}

/**
 * Creates a new blog post.
 * Authorization: admin role + feature flag (triple-layered with RLS).
 */
export async function createPost(
  input: BlogPostFormData
): Promise<BlogActionResult> {
  assertFeatureEnabled("blog");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Neautentificat" };

  const role = await getServerRole(supabase);
  requireAdmin(role);

  const parsed = blogPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const data = parsed.data;
  const readingTime = readingTimeMinutes(data.content_markdown);
  const excerpt =
    data.excerpt || autoExcerpt(data.content_markdown);

  const isPublishing = data.status === "published";

  const { data: post, error } = await supabase
    .from("blog_posts")
    .insert({
      ...data,
      excerpt: excerpt || null,
      cover_image_url: data.cover_image_url || null,
      seo_title: data.seo_title || null,
      seo_description: data.seo_description || null,
      canonical_url: data.canonical_url || null,
      reading_time_minutes: readingTime,
      author_id: user.id,
      published_at: isPublishing ? new Date().toISOString() : null,
    })
    .select("id, slug")
    .single();

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Acest slug este deja folosit" };
    return { ok: false, error: error.message };
  }

  revalidateBlog(post.slug);

  if (isPublishing) {
    void triggerNewsletterNotify(post.id);
  }

  return { ok: true, id: post.id, slug: post.slug };
}

/**
 * Updates an existing blog post.
 * Triggers newsletter notify when transitioning to published.
 */
export async function updatePost(
  id: string,
  input: BlogPostFormData,
  previousStatus: string
): Promise<BlogActionResult> {
  assertFeatureEnabled("blog");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Neautentificat" };

  const role = await getServerRole(supabase);
  requireAdmin(role);

  const parsed = blogPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const data = parsed.data;
  const readingTime = readingTimeMinutes(data.content_markdown);
  const excerpt = data.excerpt || autoExcerpt(data.content_markdown);
  const isFreshPublish = previousStatus !== "published" && data.status === "published";

  const { data: post, error } = await supabase
    .from("blog_posts")
    .update({
      ...data,
      excerpt: excerpt || null,
      cover_image_url: data.cover_image_url || null,
      seo_title: data.seo_title || null,
      seo_description: data.seo_description || null,
      canonical_url: data.canonical_url || null,
      reading_time_minutes: readingTime,
      published_at: isFreshPublish ? new Date().toISOString() : undefined,
    })
    .eq("id", id)
    .select("id, slug")
    .single();

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Acest slug este deja folosit" };
    return { ok: false, error: error.message };
  }

  revalidateBlog(post.slug);

  if (isFreshPublish) {
    void triggerNewsletterNotify(post.id);
  }

  return { ok: true, id: post.id, slug: post.slug };
}

/**
 * Toggles a post between published and draft.
 * Triggers newsletter notify only when switching draft → published.
 */
export async function togglePublish(
  id: string,
  currentStatus: string
): Promise<BlogActionResult> {
  assertFeatureEnabled("blog");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Neautentificat" };

  const role = await getServerRole(supabase);
  requireAdmin(role);

  const nextStatus = currentStatus === "published" ? "draft" : "published";
  const isFreshPublish = nextStatus === "published";

  const updatePayload: Record<string, unknown> = { status: nextStatus };
  if (isFreshPublish) updatePayload.published_at = new Date().toISOString();

  const { data: post, error } = await supabase
    .from("blog_posts")
    .update(updatePayload)
    .eq("id", id)
    .select("id, slug")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidateBlog(post.slug);

  if (isFreshPublish) {
    void triggerNewsletterNotify(post.id);
  }

  return { ok: true, id: post.id, slug: post.slug };
}

/**
 * Permanently deletes a blog post.
 */
export async function deletePost(id: string, slug: string): Promise<BlogActionResult> {
  assertFeatureEnabled("blog");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Neautentificat" };

  const role = await getServerRole(supabase);
  requireAdmin(role);

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateBlog(slug);
  return { ok: true };
}
