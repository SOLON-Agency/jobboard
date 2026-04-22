import type { Tables } from "@/types/database";
import appSettings from "@/config/app.settings.json";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type JobWithCompany = Tables<"job_listings"> & {
  companies: Tables<"companies"> | null;
};

export const generateJobPostingJsonLd = (
  job: JobWithCompany,
  benefits?: { name: string }[]
) => ({
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "@id": `${BASE_URL}/jobs/${job.slug}`,
  url: `${BASE_URL}/jobs/${job.slug}`,
  title: job.title,
  description: job.description ?? "",
  datePosted: job.published_at ?? job.created_at,
  validThrough: job.expires_at ?? undefined,
  directApply: true,
  employmentType: mapJobType(job.job_type),
  identifier: {
    "@type": "PropertyValue",
    name: "id",
    value: job.id,
  },
  jobLocation: job.is_remote
    ? { "@type": "VirtualLocation" }
    : {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: job.location ?? "",
          addressCountry: "RO",
        },
      },
  applicantLocationRequirements: job.is_remote
    ? { "@type": "Country", name: "Romania" }
    : undefined,
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
          currency: job.salary_currency ?? appSettings.config.currency,
          value: {
            "@type": "QuantitativeValue",
            minValue: job.salary_min ?? undefined,
            maxValue: job.salary_max ?? undefined,
            unitText: "MONTH",
          },
        }
      : undefined,
  jobBenefits:
    benefits && benefits.length > 0
      ? benefits.map((b) => b.name).join(", ")
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
  "@id": `${BASE_URL}/companies/${company.slug}`,
  name: company.name,
  description: company.description ?? undefined,
  url: company.website ?? `${BASE_URL}/companies/${company.slug}`,
  logo: company.logo_url ?? undefined,
  foundingDate: company.founded_year?.toString() ?? undefined,
  sameAs: [company.website].filter(Boolean) as string[],
  address: company.location
    ? {
        "@type": "PostalAddress",
        addressLocality: company.location,
        addressCountry: "RO",
      }
    : undefined,
});

export const generatePersonJsonLd = (
  profile: {
    slug: string | null;
    full_name: string | null;
    headline: string | null;
    avatar_url: string | null;
  },
  skills?: { name: string }[]
) => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": profile.slug ? `${BASE_URL}/users/${profile.slug}` : undefined,
  name: profile.full_name ?? undefined,
  description: profile.headline ?? undefined,
  url: profile.slug ? `${BASE_URL}/users/${profile.slug}` : undefined,
  jobTitle: profile.headline ?? undefined,
  image: profile.avatar_url ?? undefined,
  knowsAbout:
    skills && skills.length > 0 ? skills.map((s) => s.name) : undefined,
});

export const generateBreadcrumbJsonLd = (
  crumbs: { name: string; url: string }[]
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.name,
    item: c.url,
  })),
});

export const generateWebSiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
  url: BASE_URL,
  name: appSettings.name,
  description:
    "Găsește-ți următoarea oportunitate în cariera juridică. Răsfoiește locuri de muncă de la cele mai bune firme de avocatură.",
  inLanguage: "ro-RO",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/jobs?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
});
