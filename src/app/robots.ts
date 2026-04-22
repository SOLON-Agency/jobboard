import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const publicDisallow = ["/dashboard/", "/auth/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: publicDisallow },
      { userAgent: "GPTBot", allow: "/", disallow: publicDisallow },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: publicDisallow },
      { userAgent: "PerplexityBot", allow: "/", disallow: publicDisallow },
      { userAgent: "ClaudeBot", allow: "/", disallow: publicDisallow },
      { userAgent: "anthropic-ai", allow: "/", disallow: publicDisallow },
      { userAgent: "GoogleBot", allow: "/", disallow: publicDisallow },
      { userAgent: "Googlebot-News", allow: "/", disallow: publicDisallow },
      { userAgent: "bingbot", allow: "/", disallow: publicDisallow },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
