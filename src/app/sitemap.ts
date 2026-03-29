import { createStaticClient } from "@/lib/supabase/static";
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
    const { data: jobs } = await supabase
      .from("job_listings")
      .select("slug, updated_at")
      .eq("status", "published");

    jobPages = (jobs ?? []).map((job) => ({
      url: `${BASE_URL}/jobs/${job.slug}`,
      lastModified: new Date(job.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch { /* build-time fallback */ }

  let companyPages: MetadataRoute.Sitemap = [];
  try {
    const { data: companies } = await supabase
      .from("companies")
      .select("slug, updated_at");

    companyPages = (companies ?? []).map((company) => ({
      url: `${BASE_URL}/companies/${company.slug}`,
      lastModified: new Date(company.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch { /* build-time fallback */ }

  return [...staticPages, ...jobPages, ...companyPages];
}
