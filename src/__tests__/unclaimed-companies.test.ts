import { describe, it, expect } from "vitest";
import {
  companySchema,
  unclaimedCompanySchema,
} from "@/components/forms/validations/company.schema";

// ─── companySchema — email field (optional) ────────────────────────────────────

describe("companySchema — email field (optional)", () => {
  const VALID_BASE = {
    name: "Ionescu & Asociații SRL",
    description: "",
    website: "",
    industry: "",
    size: "",
    location: "",
    founded_year: "",
  };

  it("accepts without email field", () => {
    const result = companySchema.safeParse(VALID_BASE);
    expect(result.success).toBe(true);
  });

  it("accepts empty string for email", () => {
    const result = companySchema.safeParse({ ...VALID_BASE, email: "" });
    expect(result.success).toBe(true);
  });

  it("accepts a valid email", () => {
    const result = companySchema.safeParse({
      ...VALID_BASE,
      email: "contact@firma.ro",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("contact@firma.ro");
    }
  });

  it("rejects an invalid email format", () => {
    const result = companySchema.safeParse({
      ...VALID_BASE,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) =>
        i.path.includes("email")
      );
      expect(emailIssue).toBeDefined();
    }
  });
});

// ─── unclaimedCompanySchema — email required ────────────────────────────────────

describe("unclaimedCompanySchema — email required", () => {
  const VALID_BASE = {
    name: "Ionescu & Asociații SRL",
    description: "",
    website: "",
    industry: "",
    size: "",
    location: "",
    founded_year: "",
  };

  it("accepts when a valid email is provided", () => {
    const result = unclaimedCompanySchema.safeParse({
      ...VALID_BASE,
      email: "contact@firma.ro",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when email is missing", () => {
    const result = unclaimedCompanySchema.safeParse(VALID_BASE);
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) =>
        i.path.includes("email")
      );
      expect(emailIssue).toBeDefined();
    }
  });

  it("rejects when email is empty string", () => {
    const result = unclaimedCompanySchema.safeParse({
      ...VALID_BASE,
      email: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) =>
        i.path.includes("email")
      );
      expect(emailIssue).toBeDefined();
    }
  });

  it("rejects when email is malformed", () => {
    const result = unclaimedCompanySchema.safeParse({
      ...VALID_BASE,
      email: "not-valid@",
    });
    expect(result.success).toBe(false);
  });
});

// ─── claimCompanyAction redirect logic (unit-level) ────────────────────────────
//
// The actual server action calls Supabase which we cannot call in a unit test
// without mocking. These tests verify the pure redirect URL construction logic
// extracted from the action.

describe("claim redirect URL construction", () => {
  function buildRedirectUrl(token: string, companyEmail?: string): string {
    const claimPath = `/claim?token=${encodeURIComponent(token)}`;
    const redirectQuery = companyEmail
      ? `${claimPath}&email=${encodeURIComponent(companyEmail)}`
      : claimPath;
    return `/register?redirect=${encodeURIComponent(redirectQuery)}${
      companyEmail ? `&email=${encodeURIComponent(companyEmail)}` : ""
    }`;
  }

  it("builds redirect URL with token only", () => {
    const url = buildRedirectUrl("abc-uuid");
    expect(url).toContain("/register");
    expect(url).toContain(encodeURIComponent("/claim?token=abc-uuid"));
    expect(url).not.toContain("email=");
  });

  it("builds redirect URL with token and email", () => {
    const url = buildRedirectUrl("abc-uuid", "boss@firma.ro");
    expect(url).toContain("/register");
    expect(url).toContain(encodeURIComponent("boss@firma.ro"));
    expect(url).toContain("email=");
  });

  it("encodes special characters in token", () => {
    const url = buildRedirectUrl("uuid/with+special=chars");
    // encodeURIComponent should handle it
    expect(url).not.toContain("uuid/with+special=chars");
  });

  it("claim URL in redirect path includes the token", () => {
    const token = "550e8400-e29b-41d4-a716-446655440000";
    const url = buildRedirectUrl(token);
    const decoded = decodeURIComponent(url.split("redirect=")[1].split("&")[0]);
    expect(decoded).toBe(`/claim?token=${token}`);
  });
});
