#!/usr/bin/env node

/**
 * Smoke Tests
 *
 * Verifies that every public-facing page returns HTTP 2xx, renders a <title>,
 * and does not immediately throw a JS error visible in the console.
 *
 * Usage:
 *   NEXT_PUBLIC_SITE_URL=https://jobboard-sand.vercel.app/ node e2e/smoke.js
 */

'use strict';

require('dotenv').config({ path: '.env.local' });

const { TestRunner } = require('./runner');
const { launchBrowser, newPage, goto, expectSelector, screenshotOnFail, BASE_URL } = require('./helpers');

// ── Public pages to smoke-test ────────────────────────────────────────────────

const PUBLIC_PAGES = [
  { path: '/',               label: 'Homepage' },
  { path: '/jobs',           label: 'Jobs listing' },
  { path: '/how-it-works',   label: 'How it works' },
  { path: '/anunt',          label: 'Post a job (anunt wizard)' },
  { path: '/policy',         label: 'Privacy policy' },
  { path: '/login',          label: 'Login' },
  { path: '/register',       label: 'Register' },
  { path: '/verify-email',   label: 'Verify email' },
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
          await goto(page, path);

          // Every page must have a non-empty <title>
          const title = await page.title();
          if (!title?.trim()) throw new Error('Page rendered without a <title>');

          // The global <nav> (Navbar) must be present
          await expectSelector(page, 'nav', 5000);

          // No uncaught JS errors in the first render
          const errors = page._consoleErrors.filter(
            // Filter out known third-party noise
            (e) => !e.includes('favicon') && !e.includes('fonts.googleapis')
          );
          if (errors.length > 0) {
            throw new Error(`Browser console errors:\n  ${errors.join('\n  ')}`);
          }
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
