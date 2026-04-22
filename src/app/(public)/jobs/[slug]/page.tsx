import { notFound } from "next/navigation";
import { Container } from "@mui/material";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import { getJobBySlug, getAllJobSlugs, getRelatedJobs } from "@/services/jobs.service";
import { getJobBenefits } from "@/services/benefits.service";
import { generateJobPostingJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JobDetailWrapper } from "@/components/jobs/JobDetailWrapper";
import { JobsCarousel } from "@/components/jobs/JobsCarousel";
import { JobCtaBanner } from "@/components/layout/JobCtaBanner";
import type { Metadata } from "next";

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const supabase = createStaticClient();
    const slugs = await getAllJobSlugs(supabase);
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  try {
    const job = await getJobBySlug(supabase, slug);
    const company = job.companies?.name ?? "Companie";
    const title = `${job.title} la ${company}`;
    const description =
      job.description?.slice(0, 160) ?? `Aplică la ${job.title} — ${company}`;
    const url = `${SITE_URL}/jobs/${slug}`;

    return {
      title,
      description,
      alternates: { canonical: `/jobs/${slug}` },
      openGraph: {
        title,
        description,
        url,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
      robots: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
      },
    };
  } catch {
    return { title: "Anunț negăsit" };
  }
}

export default async function JobPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  let job;
  try {
    job = await getJobBySlug(supabase, slug);
  } catch {
    notFound();
  }

  const [relatedJobs, benefits] = await Promise.all([
    getRelatedJobs(supabase, job.id, job.job_type, 6),
    getJobBenefits(supabase, job.id),
  ]);

  const jobJsonLd = generateJobPostingJsonLd(
    job,
    benefits.map((b) => ({ name: b.title }))
  );
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Acasă", url: SITE_URL },
    { name: "Locuri de muncă", url: `${SITE_URL}/jobs` },
    { name: job.title, url: `${SITE_URL}/jobs/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Container maxWidth="lg" sx={{ py: 4, mb: 2 }}>
        <JobDetailWrapper job={job} benefits={benefits} />
        <JobsCarousel subtitle="Posturi similare" jobs={relatedJobs} autoScroll={false} />
      </Container>
      <JobCtaBanner />
    </>
  );
}
