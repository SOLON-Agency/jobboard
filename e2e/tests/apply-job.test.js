#!/usr/bin/env node

/**
 * Apply to Job Test Suite
 *
 * Tests the job-application flow:
 * 1. /jobs listing page loads and shows at least one job card
 * 2. Clicking a job card opens the detail page
 * 3. The detail page contains an "Aplică" (apply) button or application form
 * 4. (Authenticated) A logged-in user can open the application dialog
 *
 * Tests 1–3 run without credentials.
 * Test 4 requires E2E_TEST_EMAIL + E2E_TEST_PASSWORD.
 */

'use strict';

require('dotenv').config({ path: '.env.local' });

const { TestRunner } = require('../runner');
const {
  launchBrowser,
  newPage,
  goto,
  expectSelector,
  screenshotOnFail,
  waitForNav,
} = require('../helpers');

const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

// ── Helpers ───────────────────────────────────────────────────────────────────

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

/**
 * Find the href of the first job card/link on /jobs.
 * Returns null when no jobs are listed.
 */
async function findFirstJobUrl(page) {
  return page.evaluate(() => {
    // Job cards are typically <a> tags linking to /jobs/<slug>
    const links = Array.from(document.querySelectorAll('a[href*="/jobs/"]'));
    return links[0]?.getAttribute('href') ?? null;
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const runner = new TestRunner('Apply to Job');
  const browser = await launchBrowser();

  /** Shared job URL discovered by test 2 for reuse in tests 3 & 4 */
  let firstJobPath = null;

  try {
    await runner.run([
      // ── 1. Jobs listing ───────────────────────────────────────────────────
      {
        name: '/jobs listing page loads',
        fn: async () => {
          const page = await newPage(browser);
          try {
            await goto(page, '/jobs');
            // The listing container or at least a heading must be visible
            await expectSelector(page, 'main, [role="main"], h1, h2', 8000);
          } finally {
            await page.close();
          }
        },
      },

      // ── 2. Find a job to click ────────────────────────────────────────────
      {
        name: '/jobs listing shows at least one job card',
        fn: async () => {
          const page = await newPage(browser);
          try {
            await goto(page, '/jobs');
            await expectSelector(page, 'a[href*="/jobs/"]', 10000);
            firstJobPath = await findFirstJobUrl(page);
            if (!firstJobPath) throw new Error('No job links found on /jobs');
          } catch (err) {
            await screenshotOnFail(page, 'apply-job-listing');
            throw err;
          } finally {
            await page.close();
          }
        },
      },

      // ── 3. Job detail page ────────────────────────────────────────────────
      {
        name: 'Job detail page loads and shows apply button',
        fn: async () => {
          if (!firstJobPath) {
            throw new Error('No job URL found — listing test must pass first');
          }
          const page = await newPage(browser);
          try {
            await goto(page, firstJobPath);

            // Detail page must have a heading and at least one button
            await expectSelector(page, 'h1, h2', 8000);

            // Look for an "Aplică" / "Apply" button or application form
            const hasApplyButton = await page
              .evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button, a'));
                return buttons.some(
                  (b) =>
                    b.textContent?.toLowerCase().includes('aplic') ||
                    b.textContent?.toLowerCase().includes('apply')
                );
              });

            if (!hasApplyButton) {
              throw new Error('No "Aplică / Apply" button found on job detail page');
            }
          } catch (err) {
            await screenshotOnFail(page, 'apply-job-detail');
            throw err;
          } finally {
            await page.close();
          }
        },
      },

      // ── 4. Authenticated application flow ─────────────────────────────────
      ...(TEST_EMAIL && TEST_PASSWORD
        ? [
            {
              name: 'Logged-in user can open the application dialog',
              fn: async () => {
                if (!firstJobPath) {
                  throw new Error('No job URL — listing test must pass first');
                }
                const page = await loginAs(browser, TEST_EMAIL, TEST_PASSWORD);
                try {
                  await goto(page, firstJobPath);
                  await expectSelector(page, 'h1, h2', 8000);

                  // Click "Aplică"
                  const clicked = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const btn = buttons.find(
                      (b) =>
                        b.textContent?.toLowerCase().includes('aplic') ||
                        b.textContent?.toLowerCase().includes('apply')
                    );
                    if (!btn) return false;
                    btn.click();
                    return true;
                  });

                  if (!clicked) throw new Error('Apply button not found when authenticated');

                  // A modal / drawer / form should appear
                  await expectSelector(
                    page,
                    '[role="dialog"], [role="form"], .MuiDialog-root, .MuiDrawer-root',
                    8000
                  );
                } catch (err) {
                  await screenshotOnFail(page, 'apply-job-auth-flow');
                  throw err;
                } finally {
                  await page.close();
                }
              },
            },
          ]
        : [
            {
              name: 'Authenticated application test (SKIPPED — E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set)',
              fn: async () => {
                console.log('    ⚠  Skipped: set E2E_TEST_EMAIL + E2E_TEST_PASSWORD to enable this test.');
              },
            },
          ]),
    ]);
  } finally {
    await browser.close();
  }

  runner.writeJUnit('e2e/results/apply-job.xml');
  process.exit(runner.failed ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
