#!/usr/bin/env node

/**
 * Register Test Suite
 *
 * Tests the sign-up flow end-to-end:
 * 1. Register page renders with all fields
 * 2. Validation errors appear for empty / mismatched fields
 * 3. A new unique account can be created and the user lands on
 *    /verify-email (email confirmation required) or /dashboard
 *    (when confirmation is disabled in the project).
 */

'use strict';

require('dotenv').config({ path: '.env.local' });

const { TestRunner } = require('../runner');
const {
  launchBrowser,
  newPage,
  goto,
  expectSelector,
  clickButtonByText,
  screenshotOnFail,
  waitForNav,
} = require('../helpers');

// Use a unique e-mail per run to avoid "already registered" errors
const TEST_EMAIL = `e2e+${Date.now()}@test-legaljobs.ro`;
const TEST_PASSWORD = 'E2eTest123!';

async function main() {
  const runner = new TestRunner('Register');
  const browser = await launchBrowser();

  try {
    await runner.run([
      // ── 1. Page renders ──────────────────────────────────────────────────
      {
        name: 'Register page renders all required fields',
        fn: async () => {
          const page = await newPage(browser);
          try {
            await goto(page, '/register');
            await expectSelector(page, 'input[name="fullName"]');
            await expectSelector(page, 'input[name="email"]');
            await expectSelector(page, 'input[name="password"]');
            await expectSelector(page, 'input[name="confirmPassword"]');
            await expectSelector(page, 'button[type="submit"]');
          } finally {
            await page.close();
          }
        },
      },

      // ── 2. Client-side validation ─────────────────────────────────────────
      {
        name: 'Shows validation errors on empty submit',
        fn: async () => {
          const page = await newPage(browser);
          try {
            await goto(page, '/register');
            await page.click('button[type="submit"]');
            // At least one MUI helper text error should appear
            await expectSelector(page, '.MuiFormHelperText-root.Mui-error', 5000);
          } finally {
            await page.close();
          }
        },
      },

      // ── 3. Password mismatch validation ───────────────────────────────────
      {
        name: 'Shows error when passwords do not match',
        fn: async () => {
          const page = await newPage(browser);
          try {
            await goto(page, '/register');
            await page.type('input[name="fullName"]', 'Test User');
            await page.type('input[name="email"]', TEST_EMAIL);
            await page.type('input[name="password"]', TEST_PASSWORD);
            await page.type('input[name="confirmPassword"]', 'DifferentPassword!');
            await page.click('button[type="submit"]');
            await expectSelector(page, '.MuiFormHelperText-root.Mui-error', 5000);
          } finally {
            await page.close();
          }
        },
      },

      // ── 4. Successful registration ────────────────────────────────────────
      {
        name: 'Can register a new account and reach verify-email or dashboard',
        fn: async () => {
          const page = await newPage(browser);
          try {
            await goto(page, '/register');
            await page.type('input[name="fullName"]', 'E2E Test User');
            await page.type('input[name="email"]', TEST_EMAIL);
            await page.type('input[name="password"]', TEST_PASSWORD);
            await page.type('input[name="confirmPassword"]', TEST_PASSWORD);
            await waitForNav(page, () => page.click('button[type="submit"]'));

            const url = page.url();
            if (!url.includes('/verify-email') && !url.includes('/dashboard')) {
              throw new Error(`Unexpected URL after registration: ${url}`);
            }
          } catch (err) {
            await screenshotOnFail(page, 'register-success');
            throw err;
          } finally {
            await page.close();
          }
        },
      },

      // ── 5. Already-authenticated redirect ─────────────────────────────────
      // (skipped when no session available — this is a best-effort check)
    ]);
  } finally {
    await browser.close();
  }

  runner.writeJUnit('e2e/results/register.xml');
  process.exit(runner.failed ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
