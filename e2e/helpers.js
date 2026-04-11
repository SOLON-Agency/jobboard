#!/usr/bin/env node

/**
 * Shared Puppeteer helpers for E2E tests.
 */

'use strict';

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = (process.env.E2E_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL).replace(/\/$/, '');

// ── Browser ───────────────────────────────────────────────────────────────────

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1280,800',
    ],
  });
}

async function newPage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  page.setDefaultNavigationTimeout(20000);

  // Collect browser-side JS errors for debugging
  page._consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') page._consoleErrors.push(msg.text());
  });

  return page;
}

// ── Navigation ────────────────────────────────────────────────────────────────

/**
 * Navigate to a path relative to BASE_URL and return the response.
 * Throws if status >= 400.
 */
async function goto(page, urlPath, { waitUntil = 'domcontentloaded' } = {}) {
  const url = `${BASE_URL}${urlPath}`;
  const response = await page.goto(url, { waitUntil, timeout: 20000 });
  if (!response) throw new Error(`No response from ${url}`);
  const status = response.status();
  if (status >= 400) throw new Error(`HTTP ${status} on ${url}`);
  return response;
}

// ── Assertions ────────────────────────────────────────────────────────────────

/** Wait for a CSS selector to appear; throws with a clear message on timeout. */
async function expectSelector(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { visible: true, timeout });
  } catch {
    throw new Error(`Element not found: ${selector}`);
  }
}

/** Assert the current URL contains the given substring. */
function expectUrl(page, substring) {
  const url = page.url();
  if (!url.includes(substring)) {
    throw new Error(`Expected URL to include "${substring}", got: ${url}`);
  }
}

// ── Interaction ───────────────────────────────────────────────────────────────

/**
 * Click a <button> whose visible text includes the given string.
 * Uses in-browser DOM traversal — works with any Puppeteer version.
 */
async function clickButtonByText(page, text) {
  const clicked = await page.evaluate((text) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(
      (b) => b.textContent?.trim().replace(/\s+/g, ' ').includes(text)
    );
    if (!btn) return false;
    btn.click();
    return true;
  }, text);

  if (!clicked) throw new Error(`Button with text "${text}" not found`);
}

/**
 * Fill an input identified by its label text.
 * Finds the label, reads its `for` attribute, then types into that input.
 */
async function fillByLabel(page, labelText, value) {
  const inputId = await page.evaluate((labelText) => {
    const labels = Array.from(document.querySelectorAll('label'));
    const label = labels.find((l) => l.textContent?.trim().includes(labelText));
    return label?.htmlFor || null;
  }, labelText);

  if (inputId) {
    await page.type(`#${inputId}`, value);
  } else {
    // Fallback: MUI TextField wraps input in a div with a label sibling
    const filled = await page.evaluate((labelText, value) => {
      const labels = Array.from(document.querySelectorAll('label'));
      const label = labels.find((l) => l.textContent?.trim().includes(labelText));
      if (!label) return false;
      const parent = label.closest('.MuiFormControl-root') || label.parentElement;
      const input = parent?.querySelector('input, textarea');
      if (!input) return false;
      // Trigger React synthetic event
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      nativeInputValueSetter?.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }, labelText, value);

    if (!filled) throw new Error(`Input with label "${labelText}" not found`);
  }
}

/**
 * Wait for navigation after an action, with a reasonable timeout.
 */
async function waitForNav(page, action, { waitUntil = 'domcontentloaded' } = {}) {
  await Promise.all([
    page.waitForNavigation({ waitUntil, timeout: 20000 }).catch(() => {}),
    action(),
  ]);
}

// ── Debugging ─────────────────────────────────────────────────────────────────

/** Save a full-page screenshot to e2e/screenshots/ on test failure. */
async function screenshotOnFail(page, testName) {
  const dir = path.resolve(__dirname, 'screenshots');
  fs.mkdirSync(dir, { recursive: true });
  const safe = testName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const file = path.join(dir, `${safe}-${Date.now()}.png`);
  try {
    await page.screenshot({ path: file, fullPage: true });
    console.error(`  📸 Screenshot saved: ${file}`);
  } catch {
    // ignore screenshot errors
  }
}

module.exports = {
  BASE_URL,
  launchBrowser,
  newPage,
  goto,
  expectSelector,
  expectUrl,
  clickButtonByText,
  fillByLabel,
  waitForNav,
  screenshotOnFail,
};
