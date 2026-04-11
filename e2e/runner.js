#!/usr/bin/env node

/**
 * Minimal test runner for Puppeteer E2E tests.
 * Collects results and writes JUnit XML for GitHub Actions / dorny/test-reporter.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── XML escaping ─────────────────────────────────────────────────────────────

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ── TestRunner ────────────────────────────────────────────────────────────────

class TestRunner {
  constructor(suiteName) {
    this.suiteName = suiteName;
    this.results = [];
  }

  /**
   * Run an array of { name: string, fn: () => Promise<void> } test cases.
   * Failures are caught and recorded; execution always continues.
   */
  async run(tests) {
    console.log(`\n▶  Suite: ${this.suiteName}`);
    console.log('─'.repeat(60));

    for (const test of tests) {
      const start = Date.now();
      try {
        await test.fn();
        const ms = Date.now() - start;
        this.results.push({ name: test.name, passed: true, ms });
        console.log(`  ✓  ${test.name}  (${ms}ms)`);
      } catch (err) {
        const ms = Date.now() - start;
        const message = err?.message ?? String(err);
        const stack = err?.stack ?? message;
        this.results.push({ name: test.name, passed: false, ms, message, stack });
        console.error(`  ✗  ${test.name}  (${ms}ms)`);
        console.error(`     ${message}`);
      }
    }

    const passed = this.results.filter((r) => r.passed).length;
    const total = this.results.length;
    console.log('─'.repeat(60));
    console.log(`  ${passed}/${total} passed\n`);
  }

  /**
   * Write JUnit XML to the given path (parent directories are created).
   */
  writeJUnit(outputPath) {
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.length - passed;
    const totalSec = (this.results.reduce((s, r) => s + r.ms, 0) / 1000).toFixed(3);

    const cases = this.results
      .map((r) => {
        const timeSec = (r.ms / 1000).toFixed(3);
        if (r.passed) {
          return `    <testcase classname="${esc(this.suiteName)}" name="${esc(r.name)}" time="${timeSec}"/>`;
        }
        return [
          `    <testcase classname="${esc(this.suiteName)}" name="${esc(r.name)}" time="${timeSec}">`,
          `      <failure message="${esc(r.message)}">${esc(r.stack)}</failure>`,
          `    </testcase>`,
        ].join('\n');
      })
      .join('\n');

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<testsuites>',
      `  <testsuite name="${esc(this.suiteName)}" tests="${this.results.length}" failures="${failed}" time="${totalSec}">`,
      cases,
      '  </testsuite>',
      '</testsuites>',
    ].join('\n');

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, xml, 'utf8');
    console.log(`  JUnit XML → ${outputPath}`);
  }

  get failed() {
    return this.results.some((r) => !r.passed);
  }
}

module.exports = { TestRunner };
