# Testcase: Register (create account)

## Summary

As a visitor I can open `/register`, see the sign-up form, get client-side validation feedback, and create a new account. After a successful sign-up I land on `/verify-email` (when email confirmation is required) or `/dashboard` (when confirmation is disabled).

## Preconditions

- Target URL reachable (`--url`, `E2E_BASE_URL`, or `NEXT_PUBLIC_SITE_URL`).
- Supabase Auth sign-up enabled for the environment under test.
- No `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` required (suite generates a unique email).

## Steps

1. Open `/register`.
2. Assert fields `fullName`, `email`, `password`, `confirmPassword`, and submit are present.
3. Submit empty form → expect MUI field error helper text.
4. Fill form with mismatched passwords → expect validation error.
5. Fill form with a unique email and matching passwords → submit.
6. Wait until the URL contains `/verify-email` or `/dashboard` (client-side navigation). Fail if an error `Alert` appears.

## Assertions

| Case | Expect |
|------|--------|
| Page render | Named inputs + submit button visible |
| Empty submit | `.MuiFormHelperText-root.Mui-error` |
| Password mismatch | `.MuiFormHelperText-root.Mui-error` |
| Happy path | URL includes `/verify-email` or `/dashboard` |

## Selectors

| Element | Selector |
|---------|----------|
| Full name | `input[name="fullName"]` |
| Email | `input[name="email"]` |
| Password | `input[name="password"]` |
| Confirm password | `input[name="confirmPassword"]` |
| Submit | `button[type="submit"]` |
| Field errors | `.MuiFormHelperText-root.Mui-error` |
| Auth error alert | `.MuiAlert-standardError` / `[role="alert"].MuiAlert-root` |

## Related source files

- [`src/app/(auth)/register/page.tsx`](../../src/app/(auth)/register/page.tsx)
- [`src/components/auth/RegisterForm.tsx`](../../src/components/auth/RegisterForm.tsx)
- [`src/components/forms/validations/register.schema.ts`](../../src/components/forms/validations/register.schema.ts)
- Suite: [`e2e/tests/register.test.js`](../tests/register.test.js)

## How to run

```bash
npm run test:e2e -- --url=http://localhost:3000
# or only this file:
node e2e/tests/register.test.js --url=http://localhost:3000
```

This suite is always executed first by `npm run test:e2e` (auto-discovery order).
