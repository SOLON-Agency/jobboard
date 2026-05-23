#!/usr/bin/env node
/**
 * Compose root `.env` from layered env files for the current git branch.
 *
 *   .env.local  — shared local tooling (always)
 *   .env.test   — when on branch `test`
 *   .env.prod   — when on branch `main` (or any non-test branch)
 *
 * @see docs/ENVIRONMENTS.md
 */

const { writeComposedEnv } = require("./lib/compose-env");

if (process.env.SKIP_ENV_SYNC === "1") {
  console.log("⚠️  SKIP_ENV_SYNC=1 — skipping branch env sync.");
  process.exit(0);
}

writeComposedEnv();
