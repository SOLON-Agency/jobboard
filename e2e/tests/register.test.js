#!/usr/bin/env node

/**
 * Register Test Suite
 *
 * Tests the sign-up flow end-to-end (user story: create an account):
 * 1. Register page renders with all fields
 * 2. Validation errors appear for empty / mismatched fields
 * 3. A new unique account can be created and the user lands on
 *    /verify-email (email confirmation required) or /dashboard
 *    (when confirmation is disabled in the project).
 *
 * Docs: e2e/docs/register.md
 */

'use strict';

require('dotenv').config({ path: '.env' });

const { TestRunner } = require('../runner');
const {
  launchBrowser,
  newPage,
  goto,
  expectSelector,
  screenshotOnFail,
  BASE_URL,
} = require('../helpers');

const TEST_PASSWORD = 'E2eTest123!';

function uniqueEmail() {
  return `e2e+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test-legaljobs.ro`;
}

/** Fill the register form fields (RHF + MUI). */
async function fillRegisterForm(page, { fullName, email, password, confirmPassword }) {
  await page.type('input[name="fullName"]', fullName);
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', password);
  await page.type('input[name="confirmPassword"]', confirmPassword);
}

/**
 * After submit, wait for soft client navigation to verify-email or dashboard.
 * Fails fast if an error Alert appears.
 */
async function waitForRegisterSuccess(page, timeout = 30000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const alertText = await page.evaluate(() => {
      const alert = document.querySelector('.MuiAlert-standardError, [role="alert"].MuiAlert-root');
      return alert?.textContent?.trim() || null;
    });
    if (alertText) {
      throw new Error(`Registration failed with alert: ${alertText}`);
    }

    const url = page.url();
    if (url.includes('/verify-email') || url.includes('/dashboard')) {
      return url;
    }

    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Timed out waiting for verify-email or dashboard; still at ${page.url()}`);
}

async function main() {
  console.log(`\nRegister suite → ${BASE_URL}`);

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
            await fillRegisterForm(page, {
              fullName: 'Test User',
              email: uniqueEmail(),
              password: TEST_PASSWORD,
              confirmPassword: 'DifferentPassword!',
            });
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
          const email = uniqueEmail();
          try {
            await goto(page, '/register');
            await fillRegisterForm(page, {
              fullName: 'E2E Test User',
              email,
              password: TEST_PASSWORD,
              confirmPassword: TEST_PASSWORD,
            });
            await page.click('button[type="submit"]');
            await waitForRegisterSuccess(page);
          } catch (err) {
            await screenshotOnFail(page, 'register-success');
            throw err;
          } finally {
            await page.close();
          }
        },
      },
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
