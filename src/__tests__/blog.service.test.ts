import { describe, it, expect, vi } from "vitest";
import {
  listPublishedPosts,
  getAllPublishedSlugs,
  slugExists,
} from "@/services/blog.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Creates a minimal chainable mock that resolves with the given payload. */
function makeSupabaseMock(payload: { data?: unknown; count?: number; error?: null }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(payload),
  };
  const mock = {
    from: vi.fn().mockReturnValue({
      ...chain,
      // Make the chain itself thenable (for non-.single() calls)
      then: (resolve: (v: typeof payload) => unknown) => Promise.resolve(payload).then(resolve),
    }),
  };
  // Propagate the payload at end of chain (simulates awaiting the builder)
  Object.assign(chain, {
    then: (resolve: (v: typeof payload) => unknown) =>
      Promise.resolve(payload).then(resolve),
  });
  return mock as unknown as SupabaseClient<Database>;
}

describe("listPublishedPosts", () => {
  it("calls .eq('status', 'published') and returns paginated result", async () => {
    const mockData = [{ id: "1", slug: "test", status: "published", tags: [] }];
    const supabase = makeSupabaseMock({ data: mockData, count: 1, error: null });

    const result = await listPublishedPosts(supabase, { page: 1, limit: 9 });

    expect(supabase.from).toHaveBeenCalledWith("blog_posts");
    expect(result.count).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.page).toBe(1);
  });
});

describe("getAllPublishedSlugs", () => {
  it("returns an array of slug strings", async () => {
    const supabase = makeSupabaseMock({
      data: [{ slug: "article-one" }, { slug: "article-two" }],
      error: null,
    });
    const slugs = await getAllPublishedSlugs(supabase);
    expect(slugs).toEqual(["article-one", "article-two"]);
  });

  it("returns empty array on error", async () => {
    const supabase = makeSupabaseMock({ data: null, error: null });
    const slugs = await getAllPublishedSlugs(supabase);
    expect(slugs).toHaveLength(0);
  });
});

describe("slugExists", () => {
  it("returns false when count is 0", async () => {
    const supabase = makeSupabaseMock({ data: null, count: 0, error: null });
    const exists = await slugExists(supabase, "my-slug");
    expect(exists).toBe(false);
  });

  it("returns true when count > 0", async () => {
    const supabase = makeSupabaseMock({ data: null, count: 1, error: null });
    const exists = await slugExists(supabase, "my-slug");
    expect(exists).toBe(true);
  });
});
