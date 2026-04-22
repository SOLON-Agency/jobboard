#!/usr/bin/env node

/**
 * Push Supabase migrations to the linked project.
 *
 * Wraps `supabase db push --project-ref <ref>` with non-interactive auth so it
 * can run inside CI and the pre-commit hook without prompting.
 *
 * Usage:
 *   node scripts/push-migrations.js            # push all un-applied migrations
 *   node scripts/push-migrations.js --dry-run  # show what would be pushed
 *
 * Required env vars (loaded from .env.local if present):
 *   SUPABASE_ACCESS_TOKEN  — personal access token
 *                            https://supabase.com/dashboard/account/tokens
 *   SUPABASE_DB_PASSWORD   — database password for the linked project
 *                            (Dashboard → Project Settings → Database)
 *
 * Opt-outs:
 *   SKIP_MIGRATIONS=1  — exit 0 without doing anything
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const PROJECT_REF = 'uccivcdtfpevtykirkuw';
const CLI = path.resolve(__dirname, '../node_modules/.bin/supabase');

if (process.env.SKIP_MIGRATIONS === '1') {
  console.log('⚠️  SKIP_MIGRATIONS=1 — skipping migration push.');
  process.exit(0);
}

if (!fs.existsSync(CLI)) {
  console.error(
    `\n❌ Supabase CLI not found at ${CLI}.\n` +
      '   Run `npm install` first.\n'
  );
  process.exit(1);
}

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
if (!accessToken) {
  console.warn(
    '\n⚠️  SUPABASE_ACCESS_TOKEN is not set.\n' +
      '   Generate one at: https://supabase.com/dashboard/account/tokens\n' +
      '   Then add it to .env.local:\n' +
      '     SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxx\n' +
      '   (To bypass this check run: SKIP_MIGRATIONS=1 git commit …)\n'
  );
  process.exit(1);
}

const dbPassword = process.env.SUPABASE_DB_PASSWORD;
if (!dbPassword) {
  console.warn(
    '\n⚠️  SUPABASE_DB_PASSWORD is not set.\n' +
      '   Copy it from: Supabase Dashboard → Project Settings → Database → Connection string\n' +
      '   Then add it to .env.local:\n' +
      '     SUPABASE_DB_PASSWORD=your-db-password\n' +
      '   (To bypass this check run: SKIP_MIGRATIONS=1 git commit …)\n'
  );
  process.exit(1);
}

const extraArgs = process.argv.slice(2);
// `supabase db push` targets the linked project by default (stored in
// supabase/.temp/project-ref). `-p` passes the DB password non-interactively.
// `--yes` skips the "do you want to push" confirmation prompt.
const args = [
  'db',
  'push',
  '--linked',
  '--yes',
  '-p',
  dbPassword,
  ...extraArgs,
];

console.log(`\nPushing migrations to project ${PROJECT_REF}…\n`);

const result = spawnSync(CLI, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    SUPABASE_ACCESS_TOKEN: accessToken,
    SUPABASE_DB_PASSWORD: dbPassword,
  },
});

if (result.status !== 0) {
  console.error('\n❌ supabase db push failed.\n');
  process.exit(result.status ?? 1);
}

console.log('\n✅ Migrations pushed successfully.\n');
