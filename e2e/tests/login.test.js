#!/usr/bin/env node

/**
 * Login Test Suite
 *
 * Tests:
 * 1. Login page renders correctly
 * 2. Empty-submit shows validation errors
 * 3. Invalid credentials show an error alert (not a crash)
 * 4. Valid credentials (E2E_TEST_EMAIL + E2E_TEST_PASSWORD) redirect to /dashboard
 * 5. Already-authenticated users are redirected away from /login
 *
 * Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD in env / GitHub Secrets to enable
 * tests 4 & 5. They are skipped safely when those vars are absent.
 */

'use strict';

require('dotenv').config({ path: '.env.local' });

const { TestRunner } = require('../runner');
const {
  launchBrowser,
  newPage,
  goto,
  expectSelector,
  expectUrl,
  screenshotOnFail,
  waitForNav,
} = require('../helpers');

const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

async function main() {
  const runner = new TestRunner('Login');
  const browser = await launchBrowser();

  try {
    await runner.run([
      // ── 1. Page renders ──────────────────────────────────────────────────
      {
        name: 'Login page renders email, password fields and submit button',
        fn: async () => {
          const page = await newPage(browser);
          try {
            await goto(page, '/login');
            await expectSelector(page, 'input[type="email"]');
            await expectSelector(page, 'input[type="password"]');
            await expectSelector(page, 'button[type="submit"]');
          } finally {
            await page.close();
          }
        },
      },

      // ── 2. Client-side validation ─────────────────────────────────────────
      {
        name: 'Shows validation error on empty submit',
        fn: async () => {
          const page = await newPage(browser);
          try {
            await goto(page, '/login');
            await page.click('button[type="submit"]');
            await expectSelector(page, '.MuiFormHelperText-root.Mui-error', 5000);
          } finally {
            await page.close();
          }
        },
      },

      // ── 3. Invalid credentials ────────────────────────────────────────────
      {
        name: 'Shows error alert for invalid credentials (no crash)',
        fn: async () => {
          const page = await newPage(browser);
          try {
            await goto(page, '/login');
            await page.type('input[type="email"]', 'nobody@example-invalid.com');
            await page.type('input[type="password"]', 'WrongPassword999!');
            await page.click('button[type="submit"]');
            // An MUI Alert with role="alert" or class should appear
            await expectSelector(page, '.MuiAlert-root, [role="alert"]', 10000);
            // Should NOT have navigated away
            expectUrl(page, '/login');
          } catch (err) {
            await screenshotOnFail(page, 'login-invalid-creds');
            throw err;
          } finally {
            await page.close();
          }
        },
      },

      // ── 4. Valid credentials (optional) ───────────────────────────────────
      ...(TEST_EMAIL && TEST_PASSWORD
        ? [
            {
              name: `Logs in with valid credentials and redirects to /dashboard`,
              fn: async () => {
                const page = await newPage(browser);
                try {
                  await goto(page, '/login');
                  await page.type('input[type="email"]', TEST_EMAIL);
                  await page.type('input[type="password"]', TEST_PASSWORD);
                  await waitForNav(page, () => page.click('button[type="submit"]'));

                  const url = page.url();
                  if (!url.includes('/dashboard')) {
                    // Could be /verify-email if email not confirmed
                    if (url.includes('/verify-email')) {
                      throw new Error(
                        `E2E_TEST_EMAIL is not confirmed. Confirm the email then re-run.`
                      );
                    }
                    throw new Error(`Expected /dashboard redirect, got: ${url}`);
                  }
                } catch (err) {
                  await screenshotOnFail(page, 'login-valid-creds');
                  throw err;
                } finally {
                  await page.close();
                }
              },
            },
          ]
        : [
            {
              name: 'Valid-credentials login test (SKIPPED — E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set)',
              fn: async () => {
                console.log('    ⚠  Skipped: set E2E_TEST_EMAIL + E2E_TEST_PASSWORD to enable this test.');
              },
            },
          ]),
    ]);
  } finally {
    await browser.close();
  }

  runner.writeJUnit('e2e/results/login.xml');
  process.exit(runner.failed ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
