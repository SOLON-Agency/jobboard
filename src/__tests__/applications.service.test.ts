import { describe, it, expect, vi } from "vitest";
import {
  hasApplied,
  isApplicationsDuplicateError,
  createExternalApplication,
  submitInternalFormApplication,
} from "@/services/applications.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

describe("isApplicationsDuplicateError", () => {
  it("returns true for applications unique violation", () => {
    expect(
      isApplicationsDuplicateError({ code: "23505", message: "duplicate key applications_job_id_user_id" })
    ).toBe(true);
  });

  it("returns false for form_response duplicate", () => {
    expect(
      isApplicationsDuplicateError({ code: "23505", message: "form_response duplicate" })
    ).toBe(false);
  });

  it("returns false for non-23505 errors", () => {
    expect(isApplicationsDuplicateError({ code: "PGRST116" })).toBe(false);
  });
});

describe("hasApplied", () => {
  it("returns true when an application row exists", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: "app-1" }, error: null }),
      }),
    } as unknown as SupabaseClient<Database>;

    await expect(hasApplied(supabase, "job-1", "user-1")).resolves.toBe(true);
    expect(supabase.from).toHaveBeenCalledWith("applications");
  });

  it("returns false when no application exists", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    } as unknown as SupabaseClient<Database>;

    await expect(hasApplied(supabase, "job-1", "user-1")).resolves.toBe(false);
  });
});

describe("createExternalApplication", () => {
  it("inserts a pending application with null form_data", async () => {
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "app-1", job_id: "job-1", user_id: "user-1", status: "pending" },
          error: null,
        }),
      }),
    });
    const supabase = {
      from: vi.fn().mockReturnValue({ insert }),
    } as unknown as SupabaseClient<Database>;

    const result = await createExternalApplication(supabase, "job-1", "user-1");
    expect(result.id).toBe("app-1");
    expect(insert).toHaveBeenCalledWith({
      job_id: "job-1",
      user_id: "user-1",
      form_data: null,
      status: "pending",
    });
  });
});

describe("submitInternalFormApplication", () => {
  it("returns 409 when user already applied", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "job_listings") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "job-1",
                application_form_id: "form-1",
                status: "published",
                is_archived: false,
              },
              error: null,
            }),
          };
        }
        if (table === "forms") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: "form-1", status: "published", is_archived: false },
              error: null,
            }),
          };
        }
        if (table === "form_fields") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === "applications") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: "existing" }, error: null }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await submitInternalFormApplication(supabase, {
      jobId: "job-1",
      userId: "user-1",
      userEmail: "a@b.com",
      userFullName: "Test User",
      fieldValues: {},
    });

    expect(result).toEqual({
      ok: false,
      status: 409,
      message: "Ai aplicat deja la acest anunț.",
      code: "23505",
    });
  });
});
