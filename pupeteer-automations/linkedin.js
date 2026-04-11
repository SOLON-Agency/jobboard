#!/usr/bin/env node

/**
 * LinkedIn Button Clicker Script
 * 
 * Usage:
 *   node linkedin-clicker.js -min=3
 * 
 * If -min is not provided, defaults to 1 minute.
 * 
 * Requires NEXT_LINKEDIN_EMAIL and NEXT_LINKEDIN_PASSWORD in .env.local
 */

const puppeteer = require('puppeteer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// ---- CONFIG ----
const TARGET_URL = 'https://www.linkedin.com/company/101040602/admin/feed/following/';
const LOGIN_URL = 'https://www.linkedin.com/login';
const BUTTON_SELECTOR = '.react-button__trigger:not(.react-button--active)';

const LINKEDIN_EMAIL = process.env.NEXT_LINKEDIN_EMAIL;
const LINKEDIN_PASSWORD = process.env.NEXT_LINKEDIN_PASSWORD;

if (!LINKEDIN_EMAIL || !LINKEDIN_PASSWORD) {
  console.error('Missing NEXT_LINKEDIN_EMAIL or NEXT_LINKEDIN_PASSWORD in .env.local');
  process.exit(1);
}

// ---- CLI ARG PARSING ----
const args = process.argv.slice(2);
const minArg = args.find(arg => arg.startsWith('-min='));
const durationMinutes = minArg ? parseInt(minArg.split('=')[1], 10) : 1;

if (isNaN(durationMinutes) || durationMinutes <= 0) {
  console.error('Invalid -min value. Must be a positive number.');
  process.exit(1);
}

const durationMs = durationMinutes * 60 * 1000;

// ---- UTILS ----
const randomDelay = (min = 2000, max = 7000) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ---- MAIN ----
(async () => {
  const browser = await puppeteer.launch({
    headless: false, // 👈 window preview ON
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  // ---- AUTHENTICATION ----
  console.log('Navigating to LinkedIn login...');
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

  await page.type('#username', LINKEDIN_EMAIL, { delay: randomDelay(50, 120) });
  await page.type('#password', LINKEDIN_PASSWORD, { delay: randomDelay(50, 120) });

  // Race click + navigation together to avoid frame-detach race condition
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }),
    page.click('[data-litms-control-urn="login-submit"]'),
  ]);

  if (page.url().includes('/login') || page.url().includes('/checkpoint')) {
    console.error('Login failed or security checkpoint triggered. Check your credentials or complete the challenge manually.');
    await browser.close();
    process.exit(1);
  }

  console.log('Logged in successfully.');

  // ---- NAVIGATE TO TARGET ----
  // Use 'domcontentloaded' — the admin feed keeps background polling so
  // 'networkidle2' never fires within the default 30 s timeout.
  console.log(`Opening ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const startTime = Date.now();

  while (Date.now() - startTime < durationMs) {
    const buttons = await page.$$(BUTTON_SELECTOR);

    if (!buttons.length) {
      console.log('No buttons found, retrying...');
      await sleep(3000);
      continue;
    }

    console.log(`Found ${buttons.length} buttons.`);

    for (let i = 0; i < buttons.length; i++) {
      if (Date.now() - startTime >= durationMs) break;

      try {
        console.log(`Clicking button ${i + 1}/${buttons.length}`);
        await buttons[i].click();
      } catch (err) {
        console.warn(`Failed to click button ${i + 1}:`, err.message);
      }

      const delay = randomDelay();
      console.log(`Waiting ${delay / 1000}s...`);
      await sleep(delay);
    }
  }

  console.log('⏱ Time elapsed. Closing browser...');
  await browser.close();
})();
