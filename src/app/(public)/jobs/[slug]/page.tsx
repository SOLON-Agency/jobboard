import { notFound } from "next/navigation";
import { Container, Divider } from "@mui/material";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import { getJobBySlug, getAllJobSlugs, getRelatedJobs } from "@/services/jobs.service";
import { generateJobPostingJsonLd } from "@/lib/seo";
import { JobDetailWrapper } from "@/components/jobs/JobDetailWrapper";
import { JobsCarousel } from "@/components/jobs/JobsCarousel";
import { JobCtaBanner } from "@/components/layout/JobCtaBanner";
import type { Metadata } from "next";

export const revalidate = 60;

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
    return {
      title: `${job.title} at ${job.companies?.name ?? "Company"}`,
      description: job.description?.slice(0, 160) ?? `Apply for ${job.title}`,
      openGraph: {
        title: `${job.title} at ${job.companies?.name ?? "Company"}`,
        description: job.description?.slice(0, 160) ?? `Apply for ${job.title}`,
        type: "article",
      },
    };
  } catch {
    return { title: "Job Not Found" };
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

  const [jsonLd, relatedJobs] = await Promise.all([
    Promise.resolve(generateJobPostingJsonLd(job)),
    getRelatedJobs(supabase, job.id, job.job_type, 6),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container maxWidth="lg" sx={{ py: 4, mb: 2 }}>
        <JobDetailWrapper job={job} />
        <JobsCarousel title="Posturi similare" jobs={relatedJobs} />
      </Container>
      <JobCtaBanner />
    </>
  );
}
