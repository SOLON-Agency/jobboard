#!/usr/bin/env node

/**
 * Full E2E Test Orchestrator
 *
 * Runs each individual test suite sequentially, collects exit codes, and
 * exits non-zero if any suite fails. Each suite manages its own JUnit XML file
 * under e2e/results/.
 *
 * Add new suites by appending entries to TEST_SUITES below.
 *
 * Usage:
 *   NEXT_PUBLIC_SITE_URL=https://jobboard-sand.vercel.app/ \
 *   E2E_TEST_EMAIL=test@example.com \
 *   E2E_TEST_PASSWORD=secret \
 *   node e2e/full.js
 */

'use strict';

require('dotenv').config({ path: '.env.local' });

const { execFileSync } = require('child_process');
const path = require('path');

const TEST_SUITES = [
  'tests/register.test.js',
  'tests/login.test.js',
  'tests/create-listing.test.js',
  'tests/create-company.test.js',
  'tests/apply-job.test.js',
];

async function main() {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  Full E2E Test Run');
  console.log('══════════════════════════════════════════════════════════');

  const results = [];

  for (const suite of TEST_SUITES) {
    const scriptPath = path.resolve(__dirname, suite);
    console.log(`\n→ ${suite}`);
    let exitCode = 0;

    try {
      execFileSync(process.execPath, [scriptPath], {
        stdio: 'inherit',
        env: process.env,
      });
    } catch (err) {
      exitCode = err.status ?? 1;
    }

    results.push({ suite, exitCode });
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  Results');
  console.log('──────────────────────────────────────────────────────────');

  let anyFailed = false;
  for (const { suite, exitCode } of results) {
    const icon = exitCode === 0 ? '✓' : '✗';
    console.log(`  ${icon}  ${suite}`);
    if (exitCode !== 0) anyFailed = true;
  }

  console.log('══════════════════════════════════════════════════════════\n');
  process.exit(anyFailed ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
