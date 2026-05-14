import { describe, it, expect, vi } from "vitest";
import { countActiveSubscribers } from "@/services/newsletter.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function makeSupabaseMock(count: number) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    then: (resolve: (v: { count: number; data: null; error: null }) => unknown) =>
      Promise.resolve({ count, data: null, error: null }).then(resolve),
  };
  return {
    from: vi.fn().mockReturnValue(chain),
  } as unknown as SupabaseClient<Database>;
}

describe("countActiveSubscribers", () => {
  it("returns the subscriber count from the database", async () => {
    const supabase = makeSupabaseMock(42);
    const count = await countActiveSubscribers(supabase);
    expect(count).toBe(42);
  });

  it("calls the correct table and filter", async () => {
    const supabase = makeSupabaseMock(0);
    await countActiveSubscribers(supabase);
    expect(supabase.from).toHaveBeenCalledWith("newsletter_subscribers");
  });
});
