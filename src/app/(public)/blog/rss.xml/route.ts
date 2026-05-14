import { assertFeatureEnabled } from "@/lib/feature-flags";
import { createStaticClient } from "@/lib/supabase/static";
import { listPublishedPosts } from "@/services/blog.service";
import { escapeXml } from "@/lib/blog/markdown";
import appSettings from "@/config/app.settings.json";

export const revalidate = 600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function buildRssXml(
  posts: Awaited<ReturnType<typeof listPublishedPosts>>["data"]
): string {
  const items = posts
    .map((post) => {
      const url = `${SITE_URL}/blog/${post.slug}`;
      const pubDate = post.published_at
        ? new Date(post.published_at).toUTCString()
        : new Date().toUTCString();
      const description = escapeXml(post.excerpt ?? "");
      const title = escapeXml(post.title);

      const categories = post.tags
        .map((t) => `<category>${escapeXml(t)}</category>`)
        .join("\n        ");

      return `
    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      ${categories}
    </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(appSettings.name)} — Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Articole despre cariera juridică, tendințe în recrutare și sfaturi pentru profesioniști din domeniul juridic din România.</description>
    <language>ro</language>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;
}

export async function GET() {
  assertFeatureEnabled("blog");

  try {
    const supabase = createStaticClient();
    const { data } = await listPublishedPosts(supabase, { page: 1, limit: 50 });
    const xml = buildRssXml(data);

    return new Response(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": `public, s-maxage=${revalidate}, stale-while-revalidate=60`,
      },
    });
  } catch {
    return new Response("Internal Server Error", { status: 500 });
  }
}
