import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  TARGETS,
  SUPABASE_TEST_REF,
  SUPABASE_MAIN_REF,
  resolveTarget,
  resolveSupabaseProjectRef,
  resolveSupabaseProjectId,
} = require("../lib/environment-targets.js");
const { composeEnvLayers } = require("../lib/compose-env.js");

describe("branch environment targets", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    delete process.env.SUPABASE_ENV;
    delete process.env.SUPABASE_PROJECT_REF;
    delete process.env.GIT_BRANCH;
  });

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it("maps test branch to TEST Supabase project and title prefix", () => {
    expect(resolveTarget("test")).toEqual(TARGETS.test);
    expect(resolveSupabaseProjectRef("test")).toBe(SUPABASE_TEST_REF);
    expect(resolveSupabaseProjectId("test")).toBe(SUPABASE_TEST_REF);
  });

  it("maps main branch to PROD Supabase project without title prefix", () => {
    expect(resolveTarget("main")).toEqual(TARGETS.main);
    expect(resolveSupabaseProjectRef("main")).toBe(SUPABASE_MAIN_REF);
    expect(resolveSupabaseProjectId("main")).toBe(SUPABASE_MAIN_REF);
    expect(TARGETS.main.titlePrefix).toBe("");
  });

  it("maps any non-test branch to PROD (feature branches)", () => {
    expect(resolveTarget("feature/foo")).toEqual(TARGETS.main);
    expect(resolveSupabaseProjectRef("feature/foo")).toBe(SUPABASE_MAIN_REF);
  });

  it("honours SUPABASE_ENV override over git branch", () => {
    process.env.SUPABASE_ENV = "test";
    expect(resolveTarget("main")).toEqual(TARGETS.test);

    process.env.SUPABASE_ENV = "main";
    expect(resolveTarget("test")).toEqual(TARGETS.main);
  });

  it("does not use stale SUPABASE_PROJECT_ID from process.env", () => {
    process.env.SUPABASE_PROJECT_ID = SUPABASE_TEST_REF;
    expect(resolveSupabaseProjectId("main")).toBe(SUPABASE_MAIN_REF);
  });

  it("composeEnvLayers strips title prefix on main", () => {
    const { target, merged } = composeEnvLayers("main");
    expect(target.supabaseProjectRef).toBe(SUPABASE_MAIN_REF);
    expect(merged.get("SUPABASE_PROJECT_ID")).toBe(SUPABASE_MAIN_REF);
    expect(merged.has("NEXT_PUBLIC_TITLE_PREFIX")).toBe(false);
  });

  it("composeEnvLayers sets title prefix on test", () => {
    const { target, merged } = composeEnvLayers("test");
    expect(target.supabaseProjectRef).toBe(SUPABASE_TEST_REF);
    expect(merged.get("NEXT_PUBLIC_TITLE_PREFIX")).toBe("[TEST]");
  });
});
