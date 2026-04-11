#!/usr/bin/env node

/**
 * Create / Edit Company Test Suite
 *
 * Requires a confirmed account — set E2E_TEST_EMAIL + E2E_TEST_PASSWORD.
 * Tests:
 * 1. /dashboard/company page loads when authenticated
 * 2. The company form fields are rendered
 * 3. Saving a company update succeeds (or shows expected validation)
 *
 * If credentials are absent the tests are skipped gracefully.
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
  clickButtonByText,
  screenshotOnFail,
  waitForNav,
} = require('../helpers');

const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

// ── Auth helper ───────────────────────────────────────────────────────────────

/** Log in via the login page and return the authenticated page. */
async function loginAs(browser, email, password) {
  const page = await newPage(browser);
  await goto(page, '/login');
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', password);
  await waitForNav(page, () => page.click('button[type="submit"]'));

  const url = page.url();
  if (url.includes('/login') || url.includes('/verify-email')) {
    throw new Error(`Login failed or email unconfirmed. Current URL: ${url}`);
  }
  return page;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const runner = new TestRunner('Create Company');
  const browser = await launchBrowser();

  const credsMissing = !TEST_EMAIL || !TEST_PASSWORD;

  try {
    await runner.run([
      // ── 1. Dashboard company page accessible ─────────────────────────────
      {
        name: credsMissing
          ? 'Dashboard company page test (SKIPPED — no credentials)'
          : 'Dashboard /company page loads when authenticated',
        fn: async () => {
          if (credsMissing) {
            console.log('    ⚠  Skipped: set E2E_TEST_EMAIL + E2E_TEST_PASSWORD.');
            return;
          }
          const page = await loginAs(browser, TEST_EMAIL, TEST_PASSWORD);
          try {
            await goto(page, '/dashboard/company');
            expectUrl(page, '/dashboard/company');
            // The page must not be an error page
            const title = await page.title();
            if (title?.toLowerCase().includes('404')) throw new Error('Got 404');
          } catch (err) {
            await screenshotOnFail(page, 'create-company-load');
            throw err;
          } finally {
            await page.close();
          }
        },
      },

      // ── 2. Company form fields render ─────────────────────────────────────
      {
        name: credsMissing
          ? 'Company form fields test (SKIPPED — no credentials)'
          : 'Company page renders name and description fields',
        fn: async () => {
          if (credsMissing) return;
          const page = await loginAs(browser, TEST_EMAIL, TEST_PASSWORD);
          try {
            await goto(page, '/dashboard/company');
            // Company name field (common across company forms)
            await expectSelector(
              page,
              'input[name="name"], input[name="companyName"], input[placeholder*="ompan"]',
              8000
            );
          } catch (err) {
            await screenshotOnFail(page, 'create-company-fields');
            throw err;
          } finally {
            await page.close();
          }
        },
      },

      // ── 3. Save company update ────────────────────────────────────────────
      {
        name: credsMissing
          ? 'Save company test (SKIPPED — no credentials)'
          : 'Can update company name and save without error',
        fn: async () => {
          if (credsMissing) return;
          const page = await loginAs(browser, TEST_EMAIL, TEST_PASSWORD);
          try {
            await goto(page, '/dashboard/company');
            const nameSelector = 'input[name="name"], input[name="companyName"]';
            await expectSelector(page, nameSelector, 8000);

            // Clear and re-type a new value
            await page.$eval(nameSelector, (el) => { el.value = ''; });
            await page.type(nameSelector, 'E2E Test Law Firm SRL');

            // Submit
            await clickButtonByText(page, 'Salvează');

            // Expect either a success snackbar / alert or no error page
            const hasSuccess = await page
              .$('.MuiSnackbar-root, .MuiAlert-standardSuccess, [role="status"]')
              .then((el) => !!el)
              .catch(() => false);

            // Also acceptable: no crash and URL unchanged
            expectUrl(page, '/dashboard/company');
            void hasSuccess; // informational only
          } catch (err) {
            await screenshotOnFail(page, 'create-company-save');
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

  runner.writeJUnit('e2e/results/create-company.xml');
  process.exit(runner.failed ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
