import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We test isFeatureEnabled indirectly by mocking the JSON import.
// assertFeatureEnabled calls notFound() (Next.js) when disabled — we mock that too.

const mockNotFound = vi.fn();

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
  redirect: vi.fn(),
}));

describe("feature-flags", () => {
  beforeEach(() => {
    mockNotFound.mockClear();
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("isFeatureEnabled returns true when feature is enabled", async () => {
    vi.doMock("@/config/app.settings.json", () => ({
      default: { features: { blog: true } },
    }));
    const { isFeatureEnabled } = await import("@/lib/feature-flags");
    expect(isFeatureEnabled("blog" as never)).toBe(true);
  });

  it("isFeatureEnabled returns false when feature is disabled", async () => {
    vi.doMock("@/config/app.settings.json", () => ({
      default: { features: { blog: false } },
    }));
    const { isFeatureEnabled } = await import("@/lib/feature-flags");
    expect(isFeatureEnabled("blog" as never)).toBe(false);
  });

  it("assertFeatureEnabled calls notFound() when feature is disabled", async () => {
    vi.doMock("@/config/app.settings.json", () => ({
      default: { features: { blog: false } },
    }));
    const { assertFeatureEnabled } = await import("@/lib/feature-flags");
    assertFeatureEnabled("blog" as never);
    expect(mockNotFound).toHaveBeenCalledOnce();
  });

  it("assertFeatureEnabled does not call notFound() when feature is enabled", async () => {
    vi.doMock("@/config/app.settings.json", () => ({
      default: { features: { blog: true } },
    }));
    const { assertFeatureEnabled } = await import("@/lib/feature-flags");
    assertFeatureEnabled("blog" as never);
    expect(mockNotFound).not.toHaveBeenCalled();
  });
});
