/**
 * Branch → environment mapping (TEST vs PROD).
 *
 * @see docs/ENVIRONMENTS.md
 */

const { execSync } = require("child_process");

const SUPABASE_TEST_REF = "aofjdbonfqjkosbgzsbx";
const SUPABASE_MAIN_REF = "uccivcdtfpevtykirkuw";

/** @type {Record<string, { branch: string, supabaseProjectRef: string, titlePrefix: string, vercelEnv: string, previewSiteUrl: string | null }>} */
const TARGETS = {
  test: {
    branch: "test",
    supabaseProjectRef: SUPABASE_TEST_REF,
    titlePrefix: "[TEST]",
    vercelEnv: "preview",
    previewSiteUrl: "https://jobboard-sand.vercel.app/",
  },
  main: {
    branch: "main",
    supabaseProjectRef: SUPABASE_MAIN_REF,
    titlePrefix: "",
    vercelEnv: "production",
    previewSiteUrl: null,
  },
};

function getCurrentBranch() {
  if (typeof process.env.GIT_BRANCH === "string" && process.env.GIT_BRANCH.trim()) {
    return process.env.GIT_BRANCH.trim();
  }
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "main";
  }
}

/**
 * @param {string} [branch]
 * @returns {typeof TARGETS.test | typeof TARGETS.main}
 */
function resolveTarget(branch = getCurrentBranch()) {
  if (process.env.SUPABASE_ENV === "test") return TARGETS.test;
  if (
    process.env.SUPABASE_ENV === "main" ||
    process.env.SUPABASE_ENV === "production" ||
    process.env.SUPABASE_ENV === "prod"
  ) {
    return TARGETS.main;
  }
  if (branch === "test") return TARGETS.test;
  return TARGETS.main;
}

function resolveSupabaseProjectRef(branch) {
  const override = process.env.SUPABASE_PROJECT_REF?.trim();
  if (override) return override;
  return resolveTarget(branch).supabaseProjectRef;
}

function resolveSupabaseProjectId(branch) {
  // Always derive from git branch — never trust a stale SUPABASE_PROJECT_ID in `.env`.
  return resolveSupabaseProjectRef(branch);
}

module.exports = {
  TARGETS,
  SUPABASE_TEST_REF,
  SUPABASE_MAIN_REF,
  getCurrentBranch,
  resolveTarget,
  resolveSupabaseProjectRef,
  resolveSupabaseProjectId,
};
