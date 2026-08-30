# E2E tests (Puppeteer)

Smoke and full end-to-end suites run against a **provided URL** (local, preview, or production). They do not start the Next.js server.

## Commands

```bash
# Smoke: HTTP 200 + some rendered content on public pages
npm run test:smoke -- --url=https://jobboard-sand.vercel.app

# Full e2e: all suites under e2e/tests/ (register first)
npm run test:e2e -- --url=https://jobboard-sand.vercel.app

# Both
npm run e2e -- --url=http://localhost:3000
```

npm requires `--` before custom args. Equivalents without `--url`:

| Variable | Role |
|----------|------|
| `E2E_BASE_URL` | Preferred env override (used by CI) |
| `NEXT_PUBLIC_SITE_URL` | Fallback (from composed `.env`) |

Precedence: `--url` → `E2E_BASE_URL` → `NEXT_PUBLIC_SITE_URL`.

### CI (GitHub Actions)

Workflow: [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml)

| Trigger | Target URL |
|---------|------------|
| Push to `main` | Vercel **Production** deployment for that commit |
| Pull request → `test` | That PR's Vercel **Preview** URL (via `vercel/wait-for-deployment-action`) |

Optional secrets:

| Secret | Role |
|--------|------|
| `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` | Authenticated e2e suites |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Bypass Vercel Deployment Protection on previews (Protection Bypass for Automation) |

### Authenticated suites

Login, company, listing, and apply suites need a confirmed account:

```bash
E2E_TEST_EMAIL=you@example.com E2E_TEST_PASSWORD='…' \
  npm run test:e2e -- --url=https://jobboard-sand.vercel.app
```

If those secrets are missing, those suites skip gracefully. **Register** does not need them (it creates a unique user per run).

## Layout

```
e2e/
  helpers.js          # URL resolution, Puppeteer helpers
  runner.js           # Minimal runner + JUnit XML
  smoke.js            # Public-page smoke list
  full.js             # Auto-discovers tests/*.test.js
  tests/<feature>.test.js
  docs/<feature>.md   # Testcase documentation
  results/            # JUnit XML (gitignored artefacts)
  screenshots/        # Failure screenshots
```

### Adding a suite

1. Add `e2e/tests/<feature>.test.js` (see `register.test.js`).
2. Document it in `e2e/docs/<feature>.md`.
3. Do **not** edit `full.js` — files are auto-discovered. `register.test.js` always runs first; other files run alphabetically.

### Smoke pages

Edit `PUBLIC_PAGES` in `smoke.js` when a new public route should be checked for uptime.

## Artifacts

- JUnit: `e2e/results/*.xml`
- Screenshots on failure: `e2e/screenshots/`

## Agent skill

Use the project skill **`/e2e`** (`.agents/skills/e2e/`) to author and document new e2e cases.
