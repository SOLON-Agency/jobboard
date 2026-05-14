import { describe, it, expect } from "vitest";
import type { Tables } from "@/types/database";
import { generateJobPostingJsonLd, generateOrganizationJsonLd } from "@/lib/seo";

type JobWithCompany = Tables<"job_listings"> & {
  companies: Tables<"companies"> | null;
};

const mockCompany: Tables<"companies"> = {
  archived_at: null,
  claimed_at: null,
  claimed_by: null,
  created_at: "2026-01-01T00:00:00Z",
  created_by: "user-id",
  description: null,
  email: null,
  engages: 0,
  founded_year: 2010,
  id: "comp-id",
  industry: "Legal",
  is_archived: false,
  is_claimed: false,
  location: "Bucharest",
  logo_url: null,
  name: "Test Law Firm",
  size: "50-200",
  slug: "test-law-firm",
  updated_at: "2026-01-01T00:00:00Z",
  visits: 0,
  website: "https://example.com",
};

describe("generateJobPostingJsonLd", () => {
  const mockJob: JobWithCompany = {
    application_form_id: null,
    application_url: null,
    applications_count: 0,
    archived_at: null,
    benefits_count: 0,
    company_id: "comp-id",
    created_at: "2026-01-01T00:00:00Z",
    description: "Great opportunity",
    experience_level: ["senior"],
    expires_at: null,
    id: "test-id",
    is_archived: false,
    is_external: false,
    is_remote: false,
    job_type: "full-time",
    location: "Bucharest",
    published_at: "2026-01-01T00:00:00Z",
    salary_currency: "EUR",
    salary_max: 5000,
    salary_min: 3000,
    search_vector: null,
    slug: "senior-associate",
    source_hash: null,
    source_url: null,
    status: "published",
    title: "Senior Associate",
    updated_at: "2026-01-01T00:00:00Z",
    companies: mockCompany,
  };

  it("generates valid JobPosting schema", () => {
    const jsonLd = generateJobPostingJsonLd(mockJob);
    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("JobPosting");
    expect(jsonLd.title).toBe("Senior Associate");
    expect(jsonLd.employmentType).toBe("FULL_TIME");
  });

  it("includes hiring organization", () => {
    const jsonLd = generateJobPostingJsonLd(mockJob);
    expect(jsonLd.hiringOrganization?.name).toBe("Test Law Firm");
  });

  it("omits invalid hiringOrganization logo URLs from JSON-LD", () => {
    const jsonLd = generateJobPostingJsonLd({
      ...mockJob,
      companies: mockJob.companies
        ? { ...mockJob.companies, logo_url: "not-a-valid-url" }
        : null,
    });
    expect(jsonLd.hiringOrganization?.logo).toBeUndefined();
  });

  it("includes normalized hiringOrganization logo when URL is valid", () => {
    const jsonLd = generateJobPostingJsonLd({
      ...mockJob,
      companies: mockJob.companies
        ? {
            ...mockJob.companies,
            logo_url: "https://example.com/logo.png",
          }
        : null,
    });
    expect(jsonLd.hiringOrganization?.logo).toBe("https://example.com/logo.png");
  });

  it("includes salary information", () => {
    const jsonLd = generateJobPostingJsonLd(mockJob);
    expect(jsonLd.baseSalary?.currency).toBe("EUR");
    expect(jsonLd.baseSalary?.value.minValue).toBe(3000);
    expect(jsonLd.baseSalary?.value.maxValue).toBe(5000);
  });
});

describe("generateOrganizationJsonLd", () => {
  it("generates valid Organization schema", () => {
    const company: Tables<"companies"> = {
      ...mockCompany,
      id: "test",
      name: "Test Firm",
      slug: "test-firm",
      description: "A test firm",
      size: null,
      founded_year: 2015,
      created_by: "user",
    };
    const jsonLd = generateOrganizationJsonLd(company);
    expect(jsonLd["@type"]).toBe("Organization");
    expect(jsonLd.name).toBe("Test Firm");
    expect(jsonLd.url).toBe("https://example.com");
  });
});
