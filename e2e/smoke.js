#!/usr/bin/env node

/**
 * Smoke Tests
 *
 * Verifies that every public-facing page returns HTTP 200 and renders some
 * content. Does not assert that content is correct.
 *
 * Usage:
 *   npm run test:smoke -- --url=https://jobboard-sand.vercel.app
 *   E2E_BASE_URL=https://jobboard-sand.vercel.app npm run test:smoke
 */

'use strict';

require('dotenv').config({ path: '.env' });

const { TestRunner } = require('./runner');
const {
  launchBrowser,
  newPage,
  goto,
  expectHasContent,
  screenshotOnFail,
  BASE_URL,
} = require('./helpers');

// ── Public pages to smoke-test ────────────────────────────────────────────────

const PUBLIC_PAGES = [
  { path: '/', label: 'Homepage' },
  { path: '/jobs', label: 'Jobs listing' },
  { path: '/how-it-works', label: 'How it works' },
  { path: '/anunt', label: 'Post a job (anunt wizard)' },
  { path: '/policy', label: 'Privacy policy' },
  { path: '/login', label: 'Login' },
  { path: '/register', label: 'Register' },
  { path: '/verify-email', label: 'Verify email' },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nSmoke Tests → ${BASE_URL}`);

  const runner = new TestRunner('Smoke Tests');
  let browser;

  try {
    browser = await launchBrowser();

    const tests = PUBLIC_PAGES.map(({ path, label }) => ({
      name: `${label} loads (${path})`,
      fn: async () => {
        const page = await newPage(browser);
        try {
          // Allow extra time for cold Vercel boots on the first request
          await goto(page, path, { timeout: 45000, requireOk: true });
          await expectHasContent(page, 8000);
        } catch (err) {
          await screenshotOnFail(page, `smoke-${label}`);
          throw err;
        } finally {
          await page.close();
        }
      },
    }));

    await runner.run(tests);
  } finally {
    await browser?.close();
  }

  runner.writeJUnit('e2e/results/smoke.xml');
  process.exit(runner.failed ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
