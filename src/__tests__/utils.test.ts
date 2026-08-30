import { describe, it, expect } from "vitest";
import { slugify, formatSalary, timeAgo, jobTypeLabels } from "@/lib/utils";

describe("slugify", () => {
  it("converts text to URL-safe slug", () => {
    expect(slugify("Senior Legal Counsel")).toBe("senior-legal-counsel");
  });

  it("handles special characters", () => {
    expect(slugify("Job @ Company! #1")).toBe("job-company-1");
  });

  it("trims and collapses spaces", () => {
    expect(slugify("  multiple   spaces  ")).toBe("multiple-spaces");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});

describe("formatSalary", () => {
  it("formats salary range", () => {
    const result = formatSalary(3000, 5000, "EUR");
    expect(result).toContain("3.000");
    expect(result).toContain("5.000");
  });

  it("formats minimum only", () => {
    const result = formatSalary(3000, null, "EUR");
    expect(result).toContain("de la");
    expect(result).toMatch(/3[.,]000/);
  });

  it("formats maximum only", () => {
    const result = formatSalary(null, 5000, "EUR");
    expect(result).toContain("până la");
  });

  it("returns empty string for null values", () => {
    expect(formatSalary(null, null)).toBe("");
  });
});

describe("timeAgo", () => {
  it("returns 'Chiar acum' for recent dates", () => {
    expect(timeAgo(new Date().toISOString())).toBe("Chiar acum");
  });

  it("returns minutes ago", () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    expect(timeAgo(twoMinutesAgo)).toBe("acum 2 minute");
  });

  it("returns hours ago", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(timeAgo(threeHoursAgo)).toBe("acum 3 ore");
  });
});

describe("jobTypeLabels", () => {
  it("has all expected job types", () => {
    expect(jobTypeLabels["full-time"]).toBe("Normă întreagă");
    expect(jobTypeLabels["part-time"]).toBe("Jumătate de normă");
    expect(jobTypeLabels["contract"]).toBe("Colaborator");
    expect(jobTypeLabels["internship"]).toBe("Practică");
    expect(jobTypeLabels["freelance"]).toBe("Freelance");
  });
});
