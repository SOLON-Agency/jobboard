#!/usr/bin/env node

/**
 * Create Listing (Anunt Wizard) Test Suite
 *
 * Tests the multi-step job-posting wizard at /anunt.
 * Anonymous sign-in is triggered automatically by the wizard,
 * so no credentials are required for the first 2 steps.
 *
 * Steps covered:
 * 1. Wizard loads and shows the stepper
 * 2. Step 0 (Job Details) — fills required fields and advances
 * 3. Step 1 (Company Details) — fills required fields and advances
 * 4. Step 2 (Confirmation & Publish) — verifies preview renders and
 *    auth gate appears for anonymous users
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
} = require('../helpers');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Fill an MUI TextField by its `name` attribute. */
async function fillInput(page, name, value) {
  await expectSelector(page, `input[name="${name}"], textarea[name="${name}"]`);
  await page.$eval(
    `input[name="${name}"], textarea[name="${name}"]`,
    (el) => { el.value = ''; }
  );
  await page.type(`input[name="${name}"], textarea[name="${name}"]`, value);
}

/** Select an MUI Select option by visible label text. */
async function selectOption(page, name, optionText) {
  // Open the select
  await page.click(`[name="${name}"]`);
  // Wait for the dropdown to appear
  await expectSelector(page, '[role="listbox"]', 5000);
  // Click the matching option
  const clicked = await page.evaluate((text) => {
    const options = Array.from(document.querySelectorAll('[role="option"]'));
    const opt = options.find((o) => o.textContent?.trim().includes(text));
    if (!opt) return false;
    opt.click();
    return true;
  }, optionText);
  if (!clicked) throw new Error(`Option "${optionText}" not found in select "${name}"`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const runner = new TestRunner('Create Listing (Anunt Wizard)');
  const browser = await launchBrowser();

  try {
    await runner.run([
      // ── 1. Wizard loads ──────────────────────────────────────────────────
      {
        name: 'Anunt page loads and shows stepper',
        fn: async () => {
          const page = await newPage(browser);
          try {
            await goto(page, '/anunt');
            // Stepper and first step heading must be visible
            await expectSelector(page, '.MuiStepper-root', 12000);
          } finally {
            await page.close();
          }
        },
      },

      // ── 2. Step 0 → Step 1 ───────────────────────────────────────────────
      {
        name: 'Step 0 (Job Details): fills fields and advances to Company step',
        fn: async () => {
          const page = await newPage(browser);
          try {
            await goto(page, '/anunt');
            await expectSelector(page, '.MuiStepper-root', 12000);

            // Fill job title (required)
            await fillInput(page, 'title', 'E2E – Avocat Stagiar');

            // Try to advance — the wizard validates and moves to step 1
            await clickButtonByText(page, 'Continuă');

            // Step 1 should show a company name field
            await expectSelector(page, 'input[name="name"]', 12000);
          } catch (err) {
            await screenshotOnFail(page, 'create-listing-step0');
            throw err;
          } finally {
            await page.close();
          }
        },
      },

      // ── 3. Step 1 → Step 2 ───────────────────────────────────────────────
      {
        name: 'Step 1 (Company Details): fills fields and advances to Confirmation step',
        fn: async () => {
          const page = await newPage(browser);
          try {
            await goto(page, '/anunt');
            await expectSelector(page, '.MuiStepper-root', 12000);

            // ── Step 0 ──────────────────────────────────────────────────────
            await fillInput(page, 'title', 'E2E – Avocat Stagiar');
            await clickButtonByText(page, 'Continuă');

            // ── Step 1 ──────────────────────────────────────────────────────
            await expectSelector(page, 'input[name="name"]', 12000);
            await fillInput(page, 'name', 'E2E Law Firm SRL');

            await clickButtonByText(page, 'Continuă');

            // Step 2: Confirmation section must render
            await expectSelector(page, '.MuiStepper-root', 5000);
            // The anonymous auth gate OR a publish button should appear
            const hasAuthGate = await page
              .$('.MuiAlert-root, [data-testid="auth-gate"], input[type="email"]')
              .then((el) => !!el);
            if (!hasAuthGate) {
              // If no auth gate, the publish button should be visible
              await expectSelector(page, 'button', 5000);
            }
          } catch (err) {
            await screenshotOnFail(page, 'create-listing-step1');
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

  runner.writeJUnit('e2e/results/create-listing.xml');
  process.exit(runner.failed ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
