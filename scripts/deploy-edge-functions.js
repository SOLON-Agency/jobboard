#!/usr/bin/env node

/**
 * Deploy Supabase Edge Functions.
 *
 * Usage:
 *   node scripts/deploy-edge-functions.js                  # deploy all functions
 *   node scripts/deploy-edge-functions.js scrape-jobs      # deploy one function
 *   node scripts/deploy-edge-functions.js fn-a fn-b        # deploy multiple functions
 *
 * Requires SUPABASE_ACCESS_TOKEN in the environment or in .env.local.
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ---- Load .env.local -------------------------------------------------------
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const PROJECT_REF = 'uccivcdtfpevtykirkuw';
const CLI = path.resolve(__dirname, '../node_modules/.bin/supabase');
const FUNCTIONS_DIR = path.resolve(__dirname, '../supabase/functions');

// ---- Auth check ------------------------------------------------------------
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.warn(
    '\n⚠️  SUPABASE_ACCESS_TOKEN is not set.\n' +
    '   Generate one at: https://supabase.com/dashboard/account/tokens\n' +
    '   Then add it to .env.local:\n' +
    '     SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxx\n'
  );
  process.exit(1);
}

// ---- Resolve which functions to deploy -------------------------------------
const requestedSlugs = process.argv.slice(2);

let slugs;
if (requestedSlugs.length > 0) {
  slugs = requestedSlugs;
} else {
  slugs = fs
    .readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name);
}

if (slugs.length === 0) {
  console.log('No functions to deploy.');
  process.exit(0);
}

console.log(`\nDeploying ${slugs.length} Edge Function(s): ${slugs.join(', ')}\n`);

// ---- Functions that handle JWT verification themselves ---------------------
// Add a function slug here when its config.toml entry has `verify_jwt = false`.
const NO_VERIFY_JWT = new Set([
  'send-email',
  'notifications',
  'increase_company_engagement',
]);

// ---- Deploy ----------------------------------------------------------------
let failed = false;

for (const slug of slugs) {
  process.stdout.write(`  → ${slug} … `);
  const args = ['functions', 'deploy', slug, '--project-ref', PROJECT_REF];
  if (NO_VERIFY_JWT.has(slug)) args.push('--no-verify-jwt');
  try {
    execFileSync(CLI, args, {
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    console.log('✓');
  } catch (err) {
    const stderr = err.stderr?.toString().trim() ?? '';
    console.log('✗');
    console.error(`     ${stderr || err.message}`);
    failed = true;
  }
}

console.log('');

if (failed) {
  console.error('One or more deployments failed. Fix the errors above and retry.\n');
  process.exit(1);
}

console.log('All Edge Functions deployed successfully.\n');
