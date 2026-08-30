---
name: e2e
description: >-
  Author Puppeteer end-to-end and smoke tests for this jobboard repo under e2e/.
  Use when the user asks for /e2e, writes an e2e test, adds smoke coverage for a
  public page, documents a testcase, or mentions test:smoke, test:e2e, register
  flows, or e2e/tests suites.
disable-model-invocation: true
---

# E2E test authoring (`/e2e`)

Write Puppeteer suites that hit a **provided URL**. Do not start Next.js inside the scripts. Prefer existing helpers — never invent a second runner.

## Commands (remind the user)

```bash
npm run test:smoke -- --url=<URL>
npm run test:e2e -- --url=<URL>
```

URL precedence: `--url` → `E2E_BASE_URL` → `NEXT_PUBLIC_SITE_URL`.

Authenticated suites (after register) need `E2E_TEST_EMAIL` + `E2E_TEST_PASSWORD`.

## Workflow

1. **Clarify** the user story, happy path, and 1–2 negative paths.
2. **Inspect UI** in `src/`: route, form `name` / labels, success URL or toast, Romanian copy.
3. **Choose scope**
   - New **public** route only → add to `PUBLIC_PAGES` in [`e2e/smoke.js`](../../../e2e/smoke.js). Smoke checks HTTP **200** + some content only.
   - Behavioural flow → add `e2e/tests/<feature>.test.js` + `e2e/docs/<feature>.md`.
4. **Implement** the suite using [`e2e/runner.js`](../../../e2e/runner.js) + [`e2e/helpers.js`](../../../e2e/helpers.js). Mirror [`e2e/tests/register.test.js`](../../../e2e/tests/register.test.js).
5. **Document** the case in `e2e/docs/<feature>.md` (sections below).
6. **Do not** edit the suite list in `e2e/full.js` — it auto-discovers `e2e/tests/*.test.js`. `register.test.js` always runs first; other files run A–Z.

## Suite rules

- Unique emails / titles when creating data (`e2e+${Date.now()}@…`).
- Skip auth-gated cases gracefully when `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` are missing.
- Prefer stable selectors: `input[name="…"]`, `aria-label`, `button[type="submit"]`. Avoid brittle copy-only selectors unless necessary.
- Soft client navigations (`router.push`) may not fire Puppeteer `waitForNavigation` — poll `page.url()` or wait for a success landmark.
- Call `screenshotOnFail` in catch blocks for important failures.
- Write JUnit via `runner.writeJUnit('e2e/results/<feature>.xml')`.
- Match product language (Romanian UI strings where asserted).

## Doc template (`e2e/docs/<feature>.md`)

Required sections:

1. **Summary** — user story in one short paragraph  
2. **Preconditions** — URL, env secrets, feature flags  
3. **Steps** — numbered  
4. **Assertions** — table or bullets  
5. **Selectors** — table  
6. **Related source files** — links into `src/` + suite path  
7. **How to run** — `npm run test:e2e -- --url=…` and optional single-file `node e2e/tests/….test.js`

Reference example: [`e2e/docs/register.md`](../../../e2e/docs/register.md).

Copy-paste skeletons: [references/suite-template.md](references/suite-template.md).  
Stability checklist: [references/checklist.md](references/checklist.md).

## Layout reminder

See [`e2e/README.md`](../../../e2e/README.md).
