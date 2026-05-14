import type { Tables } from "@/types/database";
import appSettings from "@/config/app.settings.json";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export type BlogPostRow = Tables<"blog_posts"> & {
  author?: { full_name: string | null } | null;
};

/**
 * Schema.org BlogPosting JSON-LD for an individual blog post page.
 */
export function generateArticleJsonLd(post: BlogPostRow) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${BASE_URL}/blog/${post.slug}`,
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at,
    author: post.author?.full_name
      ? { "@type": "Person", name: post.author.full_name }
      : undefined,
    publisher: {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: appSettings.name,
      url: BASE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": post.canonical_url ?? `${BASE_URL}/blog/${post.slug}`,
    },
    keywords: post.tags.length > 0 ? post.tags.join(", ") : undefined,
    inLanguage: "ro-RO",
    url: post.canonical_url ?? `${BASE_URL}/blog/${post.slug}`,
  };
}

/**
 * Schema.org BreadcrumbList for blog post pages.
 */
export function generateBlogBreadcrumbJsonLd(postTitle: string, slug: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Acasă", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: postTitle, item: `${BASE_URL}/blog/${slug}` },
    ],
  };
}
