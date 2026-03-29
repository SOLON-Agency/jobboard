import { describe, it, expect } from "vitest";
import { generateJobPostingJsonLd, generateOrganizationJsonLd } from "@/lib/seo";

describe("generateJobPostingJsonLd", () => {
  const mockJob = {
    id: "test-id",
    company_id: "comp-id",
    title: "Senior Associate",
    slug: "senior-associate",
    description: "Great opportunity",
    location: "Bucharest",
    job_type: "full-time",
    experience_level: "senior",
    salary_min: 3000,
    salary_max: 5000,
    salary_currency: "EUR",
    is_remote: false,
    application_url: null,
    application_form_id: null,
    status: "published" as const,
    is_external: false,
    source_url: null,
    source_hash: null,
    search_vector: null as unknown,
    published_at: "2026-01-01T00:00:00Z",
    expires_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    companies: {
      id: "comp-id",
      name: "Test Law Firm",
      slug: "test-law-firm",
      description: null,
      logo_url: null,
      website: "https://example.com",
      industry: "Legal",
      size: "50-200",
      location: "Bucharest",
      founded_year: 2010,
      created_by: "user-id",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
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

  it("includes salary information", () => {
    const jsonLd = generateJobPostingJsonLd(mockJob);
    expect(jsonLd.baseSalary?.currency).toBe("EUR");
    expect(jsonLd.baseSalary?.value.minValue).toBe(3000);
    expect(jsonLd.baseSalary?.value.maxValue).toBe(5000);
  });
});

describe("generateOrganizationJsonLd", () => {
  it("generates valid Organization schema", () => {
    const jsonLd = generateOrganizationJsonLd({
      id: "test",
      name: "Test Firm",
      slug: "test-firm",
      description: "A test firm",
      logo_url: null,
      website: "https://example.com",
      industry: "Legal",
      size: null,
      location: "Bucharest",
      founded_year: 2015,
      created_by: "user",
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    });
    expect(jsonLd["@type"]).toBe("Organization");
    expect(jsonLd.name).toBe("Test Firm");
    expect(jsonLd.url).toBe("https://example.com");
  });
});
