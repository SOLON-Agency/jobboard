import type { Tables } from "@/types/database";

type JobWithCompany = Tables<"job_listings"> & {
  companies: Tables<"companies"> | null;
};

export const generateJobPostingJsonLd = (job: JobWithCompany) => ({
  "@context": "https://schema.org",
  "@type": "JobPosting",
  title: job.title,
  description: job.description ?? "",
  datePosted: job.published_at ?? job.created_at,
  validThrough: job.expires_at ?? undefined,
  employmentType: mapJobType(job.job_type),
  jobLocation: job.is_remote
    ? {
        "@type": "VirtualLocation",
      }
    : {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: job.location ?? "",
        },
      },
  hiringOrganization: job.companies
    ? {
        "@type": "Organization",
        name: job.companies.name,
        sameAs: job.companies.website ?? undefined,
        logo: job.companies.logo_url ?? undefined,
      }
    : undefined,
  baseSalary:
    job.salary_min || job.salary_max
      ? {
          "@type": "MonetaryAmount",
          currency: job.salary_currency ?? "EUR",
          value: {
            "@type": "QuantitativeValue",
            minValue: job.salary_min ?? undefined,
            maxValue: job.salary_max ?? undefined,
            unitText: "MONTH",
          },
        }
      : undefined,
});

const mapJobType = (type: string | null): string => {
  const map: Record<string, string> = {
    "full-time": "FULL_TIME",
    "part-time": "PART_TIME",
    contract: "CONTRACTOR",
    internship: "INTERN",
    freelance: "CONTRACTOR",
  };
  return type ? (map[type] ?? "OTHER") : "OTHER";
};

export const generateOrganizationJsonLd = (company: Tables<"companies">) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: company.name,
  description: company.description ?? undefined,
  url: company.website ?? undefined,
  logo: company.logo_url ?? undefined,
  foundingDate: company.founded_year?.toString() ?? undefined,
  address: company.location
    ? {
        "@type": "PostalAddress",
        addressLocality: company.location,
      }
    : undefined,
});
