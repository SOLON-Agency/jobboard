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
    expect(result).toContain("3,000");
    expect(result).toContain("5,000");
  });

  it("formats minimum only", () => {
    const result = formatSalary(3000, null, "EUR");
    expect(result).toContain("From");
    expect(result).toContain("3,000");
  });

  it("formats maximum only", () => {
    const result = formatSalary(null, 5000, "EUR");
    expect(result).toContain("Up to");
  });

  it("returns not specified for null values", () => {
    expect(formatSalary(null, null)).toBe("Not specified");
  });
});

describe("timeAgo", () => {
  it("returns 'Just now' for recent dates", () => {
    expect(timeAgo(new Date().toISOString())).toBe("Just now");
  });

  it("returns minutes ago", () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    expect(timeAgo(twoMinutesAgo)).toBe("2 minutes ago");
  });

  it("returns hours ago", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(timeAgo(threeHoursAgo)).toBe("3 hours ago");
  });
});

describe("jobTypeLabels", () => {
  it("has all expected job types", () => {
    expect(jobTypeLabels["full-time"]).toBe("Full Time");
    expect(jobTypeLabels["part-time"]).toBe("Part Time");
    expect(jobTypeLabels["contract"]).toBe("Contract");
    expect(jobTypeLabels["internship"]).toBe("Internship");
    expect(jobTypeLabels["freelance"]).toBe("Freelance");
  });
});
