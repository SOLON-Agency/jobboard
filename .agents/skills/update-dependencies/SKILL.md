---
name: update-dependencies
description: >-
  Update all npm dependencies and devDependencies to the latest versions that
  keep this jobboard (LegalJobs) platform fully functional. Use when the user
  asks for /update-dependencies, dependency bumps, npm outdated, ncu, or
  upgrading Next/MUI/React packages while preserving lint, tests, and build.
disable-model-invocation: true
---

# `/update-dependencies`

Bump every package in `package.json` to the newest **compatible** release, then verify the app still builds and passes quality gates. Prefer latest, but pin when a major breaks the platform.

## Preconditions

- Use **Node ≥ 22.12** (`engines` in `package.json`; CI uses 22). Local: `nvm use 22`.
- Do not commit secrets. Do not amend unrelated dirty work.
- Keep `next` and `eslint-config-next` on the **same version**.

## Workflow

### 1. Inventory

```bash
npx npm-check-updates
```

Note majors that historically break this repo (see Compatibility pins below).

### 2. Apply bumps

```bash
npx npm-check-updates -u
npm install
```

Then **re-pin** packages that must stay below “latest” for functionality (edit `package.json`, `npm install` again).

### 3. Known migration work (when majors land)

| Package | Action |
|---------|--------|
| `@mui/material` / `@mui/icons-material` | Stay on **latest v7** until a dedicated MUI v9 migration. v9 removes system props (`alignItems`, `fontWeight`, …) and legacy `*Outline` icons. If icons were already migrated to `*Outlined`, that is fine on v7. |
| `typescript` | Cap at **`~5.9.x`** (or max allowed by `typescript-eslint` from `eslint-config-next`, currently `<6.1.0`). Do not jump to TS 7 while Next’s ESLint stack rejects it. |
| `eslint` | Cap at **`^9`**. ESLint 10 breaks `eslint-plugin-react` shipped with `eslint-config-next`. |
| `@supabase/ssr` / `supabase-js` | ≥0.12 / recent clients throw if URL/key missing. Browser + static clients use build-time placeholders (`client.ts`, `static.ts`) so `next build` prerender works without secrets. |
| Icon imports | If MUI v9 is intentionally adopted: rename 23 legacy `*Outline` → `*Outlined` (see MUI upgrade guide). |

### 4. Repo-specific follow-ups

- **Vitest** must not collect Puppeteer suites: `exclude: ["e2e/**"]` and `include` limited to `src/**` (+ `scripts/**` tests) in `vitest.config.ts`.
- New React Compiler ESLint rules from `eslint-config-next` (`react-hooks/set-state-in-effect`, `static-components`, `purity`, `preserve-manual-memoization`): fix cheap call sites; for noisy existing patterns, extend `react-hooks-upgrade-compat` in `eslint.config.mjs` rather than leaving a red `npm run lint`.
- Prefer `router.push` over `window.location.href` for in-app navigations (`@next/next/no-location-assign-relative-destination`).
- Unit tests for `src/lib/utils.ts` must expect **Romanian** copy (`timeAgo`, `jobTypeLabels`, `formatSalary`).

### 5. Verify (required)

```bash
npm run lint
npm test
npm run build
```

All three must pass before finishing. Fix breakages introduced by the bump; do not leave the tree red.

Optional smoke (needs URL + optional `VERCEL_AUTOMATION_BYPASS_SECRET`):

```bash
npm run test:smoke -- --url=<URL>
```

### 6. Document in the change summary

List: packages bumped, pins retained and why, code migrations performed, verification results.

## Compatibility pins (current policy)

Record these in `package.json` when “latest” is unsafe:

```json
"engines": { "node": ">=22.12.0" },
"@mui/material": "^7.3.11",
"@mui/icons-material": "^7.3.11",
"eslint": "^9.39.5",
"typescript": "~5.9.3"
```

Re-check pins each run: if `eslint-config-next` gains ESLint 10 / TS 6+ support, raise the caps.

## Anti-patterns

- Blind `ncu -u` without lint/test/build.
- Bumping `next` without `eslint-config-next` (or vice versa).
- Adopting MUI v9 in this skill’s default path without a full system-prop / theme / Snackbar slots migration.
- Letting Vitest execute `e2e/**/*.test.js` (they call `process.exit` when URL is missing).

## References

- MUI v9 upgrade: https://mui.com/material-ui/migration/upgrade-to-v9/
- Project e2e: `e2e/README.md`
- Stack notes: root `AGENTS.md` (Next/React versions)
