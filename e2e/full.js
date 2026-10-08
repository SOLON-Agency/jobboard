#!/usr/bin/env node

/**
 * Full E2E Test Orchestrator
 *
 * Auto-discovers suites under e2e/tests/*.test.js, runs them sequentially,
 * collects exit codes, and exits non-zero if any suite fails. Each suite
 * manages its own JUnit XML file under e2e/results/.
 *
 * Ordering: register.test.js always runs first; remaining files are sorted
 * alphabetically. Drop a new *.test.js into e2e/tests/ to add a suite — no
 * edit to this file required.
 *
 * Usage:
 *   npm run test:e2e -- --url=https://jobboard-sand.vercel.app
 *   E2E_BASE_URL=https://jobboard-sand.vercel.app \
 *   E2E_TEST_EMAIL=test@example.com \
 *   E2E_TEST_PASSWORD=secret \
 *   npm run test:e2e
 */

'use strict';

require('dotenv').config({ path: '.env' });

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { BASE_URL } = require('./helpers');

const TESTS_DIR = path.resolve(__dirname, 'tests');

/**
 * Discover suite files. register.test.js is always first; others A–Z.
 * @returns {string[]} Filenames relative to e2e/ (e.g. tests/register.test.js)
 */
function discoverSuites() {
  const files = fs
    .readdirSync(TESTS_DIR)
    .filter((f) => f.endsWith('.test.js'));

  files.sort((a, b) => {
    if (a === 'register.test.js') return -1;
    if (b === 'register.test.js') return 1;
    return a.localeCompare(b);
  });

  return files.map((f) => path.join('tests', f));
}

async function main() {
  const suites = discoverSuites();

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  Full E2E Test Run');
  console.log(`  Target: ${BASE_URL}`);
  console.log('══════════════════════════════════════════════════════════');

  if (suites.length === 0) {
    console.error('No suites found in e2e/tests/*.test.js');
    process.exit(1);
  }

  const results = [];

  // Forward CLI --url and resolved base URL to child processes
  const childEnv = {
    ...process.env,
    E2E_BASE_URL: process.env.E2E_BASE_URL || BASE_URL,
  };

  for (const suite of suites) {
    const scriptPath = path.resolve(__dirname, suite);
    console.log(`\n→ ${suite}`);
    let exitCode = 0;

    try {
      execFileSync(process.execPath, [scriptPath, ...process.argv.slice(2)], {
        stdio: 'inherit',
        env: childEnv,
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
