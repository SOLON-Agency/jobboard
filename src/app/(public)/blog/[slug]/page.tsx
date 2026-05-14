import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { assertFeatureEnabled, isFeatureEnabled } from "@/lib/feature-flags";
import { createStaticClient } from "@/lib/supabase/static";
import { getPublishedPostBySlug, getAllPublishedSlugs } from "@/services/blog.service";
import { generateArticleJsonLd, generateBlogBreadcrumbJsonLd } from "@/lib/blog/seo";
import { BlogArticle } from "@/components/blog/BlogArticle";
import appSettings from "@/config/app.settings.json";

export const revalidate = 300;
export const dynamicParams = true;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  if (!isFeatureEnabled("blog")) return [];
  try {
    const supabase = createStaticClient();
    const slugs = await getAllPublishedSlugs(supabase);
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const supabase = createStaticClient();
    const post = await getPublishedPostBySlug(supabase, slug);

    const title = post.seo_title ?? post.title;
    const description = post.seo_description ?? post.excerpt ?? "";
    const canonicalUrl = post.canonical_url ?? `/blog/${slug}`;
    const absoluteCanonical = post.canonical_url ?? `${SITE_URL}/blog/${slug}`;
    const authorName = post.profiles?.full_name ?? appSettings.name;

    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title,
        description,
        url: absoluteCanonical,
        type: "article",
        publishedTime: post.published_at ?? undefined,
        modifiedTime: post.updated_at,
        authors: [authorName],
        tags: post.tags,
        images: post.cover_image_url
          ? [{ url: post.cover_image_url, width: 1200, height: 630, alt: title }]
          : undefined,
        siteName: appSettings.name,
        locale: "ro_RO",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: post.cover_image_url ? [post.cover_image_url] : undefined,
      },
      robots: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
      },
    };
  } catch {
    return { title: "Articol negăsit" };
  }
}

export default async function BlogPostPage({ params }: Props) {
  assertFeatureEnabled("blog");

  const { slug } = await params;
  const supabase = createStaticClient();

  const post = await getPublishedPostBySlug(supabase, slug).catch(() => null);
  if (!post) notFound();

  const articleJsonLd = generateArticleJsonLd({
    ...post,
    author: post.profiles,
  });
  const breadcrumbJsonLd = generateBlogBreadcrumbJsonLd(post.title, slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BlogArticle post={post} />
    </>
  );
}
