# E2E stability checklist

Use before marking a suite done.

## Selectors

- [ ] Prefer `name`, `id`, `aria-label`, `data-testid` over visible copy alone
- [ ] Icon-only controls asserted via `aria-label` (WCAG)
- [ ] MUI errors: `.MuiFormHelperText-root.Mui-error` or field `aria-describedby` ids when stable

## Navigation & timing

- [ ] Cold starts: first `goto` may need `timeout: 45000`
- [ ] Client `router.push` / soft nav: poll URL or wait for a landmark (do not rely only on `waitForNavigation`)
- [ ] After submit, fail fast if an error `Alert` appears

## Data & auth

- [ ] Unique insert keys per run (email, slug, title)
- [ ] Auth suites skip cleanly without `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`
- [ ] Do not hardcode production user passwords in the repo

## Smoke vs e2e

- [ ] Smoke: HTTP 200 + content only — no business assertions
- [ ] New public routes added to `PUBLIC_PAGES` in `e2e/smoke.js`
- [ ] Behavioural coverage lives in `e2e/tests/*.test.js` + `e2e/docs/*.md`

## Hygiene

- [ ] `screenshotOnFail` on critical happy-path failures
- [ ] JUnit written under `e2e/results/`
- [ ] No edits to `full.js` suite list (auto-discovery)
- [ ] Doc file mirrors the suite name (`register` ↔ `register.test.js` ↔ `register.md`)
