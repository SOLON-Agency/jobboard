import { describe, it, expect } from "vitest";
import { jobSchema } from "@/components/forms/validations/job.schema";

const VALID_BASE = {
  company_id: "company-123",
  title: "Senior Legal Counsel",
  description: "At least ten characters of description here.",
  location: "",
  job_type: "",
  experience_level: [],
  salary_min: "",
  salary_max: "",
  is_remote: false,
  application_method: "none" as const,
  application_url: "",
  form_id: "",
};

describe("jobSchema — date scheduling rules", () => {
  it("accepts when expires_at is after published_at", () => {
    const result = jobSchema.safeParse({
      ...VALID_BASE,
      published_at: "2026-05-01",
      expires_at: "2026-11-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when expires_at equals published_at", () => {
    const result = jobSchema.safeParse({
      ...VALID_BASE,
      published_at: "2026-05-01",
      expires_at: "2026-05-01",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const expiry = result.error.issues.find((i) =>
        i.path.includes("expires_at"),
      );
      expect(expiry).toBeDefined();
      expect(expiry?.message).toMatch(/după data publicării/);
    }
  });

  it("rejects when expires_at is before published_at", () => {
    const result = jobSchema.safeParse({
      ...VALID_BASE,
      published_at: "2026-11-01",
      expires_at: "2026-05-01",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const expiry = result.error.issues.find((i) =>
        i.path.includes("expires_at"),
      );
      expect(expiry).toBeDefined();
    }
  });

  it("requires published_at", () => {
    const result = jobSchema.safeParse({
      ...VALID_BASE,
      published_at: "",
      expires_at: "2026-11-01",
    });
    expect(result.success).toBe(false);
  });

  it("requires expires_at", () => {
    const result = jobSchema.safeParse({
      ...VALID_BASE,
      published_at: "2026-05-01",
      expires_at: "",
    });
    expect(result.success).toBe(false);
  });
});
