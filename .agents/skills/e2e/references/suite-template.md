# Suite + doc skeletons

## `e2e/tests/<feature>.test.js`

```js
#!/usr/bin/env node
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

const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

async function main() {
  console.log(`\n<Feature> suite → ${BASE_URL}`);
  const runner = new TestRunner('<Feature>');
  const browser = await launchBrowser();

  try {
    const tests = [
      {
        name: '<Feature> page renders',
        fn: async () => {
          const page = await newPage(browser);
          try {
            await goto(page, '/path');
            await expectSelector(page, 'main, header');
          } finally {
            await page.close();
          }
        },
      },
    ];

    if (TEST_EMAIL && TEST_PASSWORD) {
      tests.push({
        name: '<Feature> authenticated happy path',
        fn: async () => {
          const page = await newPage(browser);
          try {
            // login + exercise flow
            await goto(page, '/login');
            // …
          } catch (err) {
            await screenshotOnFail(page, '<feature>-happy');
            throw err;
          } finally {
            await page.close();
          }
        },
      });
    } else {
      console.log('  (skipping auth cases — set E2E_TEST_EMAIL / E2E_TEST_PASSWORD)');
    }

    await runner.run(tests);
  } finally {
    await browser.close();
  }

  runner.writeJUnit('e2e/results/<feature>.xml');
  process.exit(runner.failed ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
```

## `e2e/docs/<feature>.md`

```markdown
# Testcase: <Feature>

## Summary

As a <role> I want to <goal> so that <outcome>.

## Preconditions

- Target URL via `--url` / `E2E_BASE_URL` / `NEXT_PUBLIC_SITE_URL`
- (Optional) `E2E_TEST_EMAIL` + `E2E_TEST_PASSWORD`

## Steps

1. …
2. …

## Assertions

| Case | Expect |
|------|--------|
| … | … |

## Selectors

| Element | Selector |
|---------|----------|
| … | … |

## Related source files

- `src/…`
- Suite: `e2e/tests/<feature>.test.js`

## How to run

\`\`\`bash
npm run test:e2e -- --url=http://localhost:3000
node e2e/tests/<feature>.test.js --url=http://localhost:3000
\`\`\`
```
