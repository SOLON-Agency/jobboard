import { createStaticClient } from "@/lib/supabase/static";
import { getAllJobSlugs } from "@/services/jobs.service";
import { getAllCompanySlugs } from "@/services/companies.service";
import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createStaticClient();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/jobs`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/how-it-works`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  let jobPages: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllJobSlugs(supabase);
    jobPages = slugs.map((slug) => ({
      url: `${BASE_URL}/jobs/${slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch { /* build-time fallback */ }

  let companyPages: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllCompanySlugs(supabase);
    companyPages = slugs.map((slug) => ({
      url: `${BASE_URL}/companies/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch { /* build-time fallback */ }

  return [...staticPages, ...jobPages, ...companyPages];
}
