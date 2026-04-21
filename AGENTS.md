# AGENTS.md — jobboard (LegalJobs)

Guidance for AI assistants and human contributors working on this repository.

---

## Next.js and React (read this first)

<!-- BEGIN:nextjs-agent-rules -->
**This is not the Next.js from generic training data.** The app targets **Next.js 16.x** and **React 19.x** (see `package.json`). App Router conventions, metadata APIs, and bundling details may differ from older docs.

Before changing routing, data fetching, or config:

1. Prefer the official docs for the **installed** major version: [Next.js documentation](https://nextjs.org/docs).
2. Heed deprecation warnings from `next build` and ESLint (`eslint-config-next`).
3. Do not assume file locations or APIs from pre-v15 tutorials without verifying against this repo and current docs.
<!-- END:nextjs-agent-rules -->

---

## What this product is

- **Name / brand:** `LegalJobs` (see `src/config/app.settings.json`).
- **Domain:** Legal-career job board (Romanian copy in metadata and many UI strings).
- **Locale / market defaults:** `locale: "ro"`, `currency: "RON"` in app settings; keep new user-facing copy consistent unless explicitly internationalizing.

---

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Next.js (App Router), TypeScript **strict** |
| UI | MUI v7 + Emotion (`sx`, `@emotion/styled` where used) |
| Global CSS | Tailwind CSS v4 (`@import "tailwindcss"` in `src/app/globals.css`) |
| Forms / validation | react-hook-form, `@hookform/resolvers`, Zod |
| Auth & data | Supabase (`@supabase/supabase-js`, `@supabase/ssr`) |
| Rich text | TipTap |
| Charts | Recharts |
| Motion | Framer Motion |
| Markdown | react-markdown |
| Tests | Vitest + jsdom + Testing Library (`src/__tests__/`) |
| Lint | ESLint 9 flat config, `eslint-config-next` (core-web-vitals + typescript) |

---

## Repository layout (high level)

- **`src/app/`** — App Router: route groups `(public)`, `(auth)`; plain `dashboard/` segment; API route handlers under `src/app/api/`.
- **`src/components/`** — Feature and layout UI (prefer **named exports** for shared components).
  - **`src/components/forms/`** — All form components live here (not in `dashboard/` or co-located with trigger components).
    - `AddEditCompany.tsx`, `AddEditForm.tsx`, `AddEditJob.tsx`, `AddEditExperience.tsx`, `AddEditEducation.tsx` — dashboard CRUD forms.
    - `ApplicationForm.tsx` — job application drawer.
    - **`src/components/forms/validations/`** — Zod schemas and TypeScript types, one file per form domain:
      - `company.schema.ts` → `companySchema`, `CompanyFormData`
      - `job.schema.ts` → `jobSchema`, `JobFormData`
      - `experience.schema.ts` → `experienceSchema`, `ExperienceFormData`
      - `education.schema.ts` → `educationSchema`, `EducationFormData`
      - `form-builder.schema.ts` → `FieldType`, `FormField`, `FormBuilderData`, shared constants
- **`src/services/`** — Data access: async functions that take a typed `SupabaseClient<Database>` (and other params); keep side effects and Supabase shape here rather than duplicating in pages.
- **`src/hooks/`** — Client hooks (`useAuth`, `useSupabase`, etc.).
- **`src/lib/`** — Supabase factories (`client`, `server`, `middleware`, `static`), utilities, SEO helpers.
- **`src/theme/`** — MUI theme, palette, `ThemeRegistry`.
- **`src/types/`** — `database.ts` (generated/hand-maintained Supabase types), shared app types (`index.ts`).
- **`src/config/app.settings.json`** — Product name, salary defaults, feature flags, brand colors.
- **`supabase/`** — `migrations/`, `config.toml`, Edge Functions under `supabase/functions/`.
- **`middleware.ts`** (repo root) — Session refresh and auth redirects.

Path alias: **`@/*` → `./src/*`** (`tsconfig.json`).

---

## Supabase usage (project rules)

1. **Browser client:** `createClient` from `src/lib/supabase/client.ts` — use only in `"use client"` components.
2. **Server Components / Route Handlers / Server Actions:** `createClient` from `src/lib/supabase/server.ts` (cookie-based session; the `setAll` `catch` block in RSC is intentional — see the code comment).
3. **Static/ISR pages:** `createClient` from `src/lib/supabase/static.ts` (anon, no cookies).
4. **Middleware:** `updateSession` in `src/lib/supabase/middleware.ts` — refreshes the session token on every request and enforces:
   - `/dashboard/*` → redirect to `/login` if unauthenticated (preserves `?redirect=` for the callback).
   - `/login`, `/register` → redirect to `/dashboard` if already authenticated.
5. **No service-role key in the Next.js app — ever.** All application code uses the user's session plus RLS. Privileged data access (e.g. resolving a job poster's email for notifications) uses a `SECURITY DEFINER` Postgres RPC (`application_notification_recipient`), not `auth.admin` or a service-role client.

> **`src/lib/supabase/admin.ts` has been deleted.** Do not recreate it in the web app. If a new feature genuinely cannot work under RLS, write a `SECURITY DEFINER` function in a migration and call it via `.rpc()`.

**Auth callback:** `src/app/(auth)/auth/callback/route.ts` exchanges the OAuth/email code for a session then redirects.

### Transactional email (Resend via Edge Functions)

- **Job applications:** the **`job-application`** Edge Function (`supabase/functions/job-application/index.ts`) runs after a successful apply. It checks `profiles.notifications_email` for the applicant and the job poster, then calls **`notifications`** with Resend dashboard templates (`job-candidat` / `job-creator` by default; overridable via secrets). The applicant’s JWT is required; the function uses the service-role key only internally (never in the Next.js app).
- **Other transactional mail:** **`send-email`** (`supabase/functions/send-email/index.ts`) — profile updated, company created, custom test email. Callers use `supabase.functions.invoke()` with the user session JWT so DB access stays under RLS.

**`send-email` events** (pass as `event` in the JSON body):

| Event | Required body fields | Description |
|-------|---------------------|-------------|
| `profile_updated` | _(none)_ | Profile-update confirmation to the authenticated user |
| `company_created` | `company_id: string` | Company-creation welcome email to the authenticated user |
| `custom_email` | `to`, `subject`, `body` | Test / ad-hoc send (recipient must match auth user email) |

**Job application emails (client or route handler):**
```ts
void supabase.functions
  .invoke("job-application", { body: { job_id: jobId } })
  .catch((err: unknown) => console.warn("job-application:", err));
```

**Shared utilities** live in `supabase/functions/_shared/`:
- `cors.ts` — CORS headers and OPTIONS handler
- `email-templates.ts` — `buildEmail`, `detailRow`, `infoTable` HTML helpers

**Required Supabase secrets** (set with `supabase secrets set`):
- `RESEND_API_KEY` — Resend API key
- `RESEND_FROM` — verified sender, e.g. `"LegalJobs <noreply@yourdomain.com>"`
- `NEXT_PUBLIC_SITE_URL` — canonical origin, e.g. `"https://legaljobs.ro"` (same value as the Next.js env var)
- `RESEND_TEMPLATE_JOB_CREATOR` / `RESEND_TEMPLATE_JOB_CANDIDAT` — optional; default template aliases `job-creator` and `job-candidat` (must exist and be published in Resend)

### Edge Functions inventory

| Function | Status | Auth | Notes |
|----------|--------|------|-------|
| `send-email` | **Active** | user JWT | Profile / company / custom transactional HTML emails under RLS. |
| `job-application` | **Active** | user JWT (applicant) | Post-apply emails via `notifications` + Resend templates. |
| `notifications` | **Active** | user JWT **or** service-role key | Dispatcher; HTML body or Resend `resend_template`; uses service role for `auth.admin` + preferences. |
| `scrape-jobs` | **Active** (Supabase-only) | `CRON_SECRET` bearer | Job scraper; uses service role key; not in this repo. |

`send-email`, `notifications`, and `job-application` use `verify_jwt = false` and validate auth inside the function.

#### `notifications` edge function

Sends a notification to any user by `userId` through the specified channel. Respects the user's per-channel opt-in flags on `profiles`.

**Body fields:**

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `recipient` | `string` (userId) | ✅ | — |
| `channel` | `"email" \| "sms"` | ✅ | `"email"` |
| `body` | `string` | ✅* | — |
| `resend_template` | `{ id, variables }` | ✅* | — |
| `subject` | `string` | — | site name (for HTML); overrides template default when using `resend_template` |
| `idempotency_key` | `string` | — | Resend idempotency |

\* For email, provide either a non-empty `body` (HTML) or `resend_template` with a published template `id` and `variables` object.

**From React:**
```ts
void supabase.functions
  .invoke("notifications", {
    body: { recipient: userId, channel: "email", subject: "Titlu", body: "Mesaj..." },
  })
  .catch(console.warn);
```

**From another edge function (service-role call):**
```ts
await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/notifications`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ recipient: userId, channel: "email", subject: "...", body: "..." }),
});
```

**Profile preference columns** (added by migration `20260412000000`):
- `profiles.notifications_email boolean DEFAULT true`
- `profiles.notifications_sms boolean DEFAULT false` (SMS provider TBD)

### Environment variables

| Variable | Where set | Purpose |
|----------|-----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel / `.env.local` | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel / `.env.local` | Browser + server anon client (public) |
| `NEXT_PUBLIC_SITE_URL` | Vercel / `.env.local` + **Supabase Edge secrets** | Canonical origin for metadata, sitemap, auth redirects, and email links |
| `RESEND_API_KEY` | **Supabase Edge secrets only** | Transactional email via Resend (`send-email` function) |
| `RESEND_FROM` | **Supabase Edge secrets only** | Verified sender address, e.g. `"LegalJobs <noreply@yourdomain.com>"` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Supabase Edge secrets only** | `scrape-jobs`, internal calls from `notifications` / `job-application`; **never** add to Next.js / Vercel env |
| `CRON_SECRET` | **Supabase Edge secrets only** | Bearer token required by `scrape-jobs` to reject unauthorised calls |

Never commit secrets. Add new server-only variables to `.env.example` with a placeholder value and document them in this table.

---

## Code style and architecture expectations

- **TypeScript:** Strict mode; avoid `any`; narrow with `unknown` + type guards when needed.
- **Components:** Functional components; shared pieces use **named exports** (e.g. `export const Navbar`). Next.js **pages, layouts, and special files** use `default` exports as required by the framework.
- **Data layer:** Add or extend **`src/services/*.service.ts`** and pass the appropriate Supabase client from the caller (page, route handler, or server action).
- **Database types:** Use `Database`, `Tables<"…">` from `@/types` / `@/types/database` for all query results, inserts, and updates.
- **MUI:** Use theme tokens and `sx` consistently; respect the brand palette in `src/theme/palette.ts` and `app.settings.json`.
- **Feature flags:** Check `src/config/app.settings.json` `features` before exposing UI for areas that are intentionally disabled (e.g. `alerts`, `messages`).
- **SEO:** `src/lib/seo.ts`, `sitemap.ts`, `robots.ts` — keep URLs aligned with `NEXT_PUBLIC_SITE_URL`.

### Form validation (mandatory for all forms)

Every form — new **and** existing — must follow this pattern without exception:

1. **Schema file first.** Define a Zod schema in `src/components/forms/validations/<domain>.schema.ts`. Export the schema constant and the inferred `type …FormData`. Never define a schema inline inside a component.
2. **`react-hook-form` + `zodResolver`.** Wire the schema with `useForm<FormData>({ resolver: zodResolver(schema) })`. Never use uncontrolled validation or manual `useState` error tracking for form fields.
3. **Cross-field rules via `.superRefine()`.** Conditional requirements (e.g. *end date required when not current*) and inter-field comparisons (e.g. *end ≥ start*) must be expressed as `superRefine` rules in the schema — not as ad-hoc checks in submit handlers.
4. **Surface errors on every field.** Pass `error={!!errors.field}`, `helperText={errors.field?.message}`, and `aria-describedby` pointing to the helper text id on every `TextField`. Use `<FormHelperText>` for contextual hints alongside field-level errors.
5. **`noValidate` on `<form>`.** Add `noValidate` to every `<Box component="form">` so browser built-in validation doesn't conflict with Zod messages.
6. **Disable submit during flight.** Use `isSubmitting` from `formState` to `disabled` the submit button; show a Romanian "Se salvează…" label while pending.

**Naming conventions:**

| Artifact | Location | Export name pattern |
|---|---|---|
| Zod schema | `src/components/forms/validations/<domain>.schema.ts` | `<domain>Schema` |
| Inferred type | same file | `<Domain>FormData` |
| Form component | `src/components/forms/AddEdit<Domain>.tsx` | `AddEdit<Domain>` |

---

## Accessibility — WCAG 2.2 Level AAA

**Every new page and component must meet WCAG 2.2 Level AAA.** The checklist below is non-negotiable; do not merge code that violates it.

### Mandatory checks for every PR

| Category | Requirement |
|----------|-------------|
| **Colour contrast** | Text ≥ 7 : 1 against its background (AAA). UI components and graphical objects ≥ 4.5 : 1. Never use colour as the sole means to convey information. |
| **Focus management** | All interactive elements reachable and operable by keyboard alone. Focus order matches visual reading order. Visible focus indicator with ≥ 3 px offset or equivalent. |
| **ARIA semantics** | Use native HTML elements (`<button>`, `<nav>`, `<main>`, `<h1>`…`<h6>`) before reaching for ARIA. When ARIA is required, follow the [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/). Every icon-only button must have `aria-label`. |
| **Images** | Decorative images: `alt=""`. Informative images: concise, meaningful `alt`. Complex images (charts): full text alternative in the page or via `aria-describedby`. |
| **Form labels** | Every `<input>`, `<select>`, `<textarea>` has a visible `<label>` or `aria-label`. Error messages are associated with their field via `aria-describedby`. Required fields marked with `aria-required="true"` and a visible indicator. |
| **Motion** | Respect `prefers-reduced-motion`. Wrap Framer Motion animations with `useReducedMotion()`; set `duration: 0` when the preference is active. |
| **Reading level** | Body copy: target Grade 9 or simpler (Flesch-Kincaid). Avoid jargon in UI labels. |
| **Link purpose** | Every `<a>` must be understandable out of context. Avoid "click here", "read more". If the link opens a new tab, add `aria-label="… (se deschide în tab nou)"`. |
| **Timeouts** | Any session or action timeout must warn the user at least 20 seconds before expiry with an option to extend. |
| **Headings** | One `<h1>` per page. Do not skip heading levels. |
| **Live regions** | Use `role="status"` / `role="alert"` (or MUI `<Alert>`) for dynamic feedback so screen readers announce changes without moving focus. |

### MUI-specific accessibility patterns

```tsx
// Icon-only button
<IconButton aria-label="Șterge beneficiul">
  <DeleteIcon />
</IconButton>

// Error linked to its field
<TextField
  id="email"
  inputProps={{ "aria-describedby": "email-error" }}
  error={!!errors.email}
/>
<Typography id="email-error" role="alert" variant="caption" color="error">
  {errors.email?.message}
</Typography>

// Skip-navigation link (add once per layout, before <Navbar>)
<Box
  component="a"
  href="#main-content"
  sx={{
    position: "absolute",
    left: "-9999px",
    "&:focus": { left: 8, top: 8, zIndex: 9999 },
  }}
>
  Sari la conținut
</Box>

// Reduced-motion wrapper
import { useReducedMotion } from "framer-motion";
const reduced = useReducedMotion();
<motion.div animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : 0.3 }} />
```

---

## Responsive design — four breakpoint system

**All new pages and components must be tested and designed for all four layouts.** MUI's default breakpoints align with these tiers; use the `sx` responsive object syntax.

| Tier | Breakpoint | Target devices |
|------|-----------|----------------|
| **Mobile** | `xs` — `0 px → 599 px` | Phones (portrait) |
| **Tablet** | `sm` — `600 px → 899 px` | Phones (landscape), small tablets |
| **Desktop** | `md` — `900 px → 1199 px` | Laptops, tablets (landscape) |
| **Large desktop** | `lg` — `1200 px +` | Wide monitors, external displays |

### Layout conventions

```tsx
// Container widths per route group
<Container maxWidth="lg">   {/* Dashboard pages */}
<Container maxWidth="md">   {/* Forms, settings, auth, wizard */}
<Container maxWidth="xl">   {/* Full-width listing pages */}

// Responsive grid example
<Box
  sx={{
    display: "grid",
    gridTemplateColumns: {
      xs: "1fr",           // mobile: single column
      sm: "1fr 1fr",       // tablet: two columns
      md: "240px 1fr",     // desktop: sidebar + content
      lg: "280px 1fr",     // large-desktop: wider sidebar
    },
    gap: { xs: 2, md: 3 },
  }}
/>

// Typography scaling
<Typography
  variant="h2"
  sx={{ fontSize: { xs: "1.75rem", sm: "2rem", md: "2.5rem", lg: "3rem" } }}
/>

// Spacing that adapts
sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, md: 6 } }}
```

### Touch targets

Interactive elements must be at least **44 × 44 CSS px** on mobile (`xs`/`sm`). Use `size="large"` for primary action buttons on mobile, or add `sx={{ minHeight: 44, minWidth: 44 }}`.

### Component-level checklist

Before marking a component done, verify:
- [ ] Renders correctly at `xs` (360 px viewport, no horizontal scroll)
- [ ] Renders correctly at `sm` (600 px)
- [ ] Renders correctly at `md` (960 px)
- [ ] Renders correctly at `lg` (1280 px)
- [ ] No fixed pixel widths that break at smaller viewports (use `%`, `fr`, `maxWidth`, or breakpoint-aware `sx`)
- [ ] Images use `next/image` with `sizes` prop matching the breakpoint layout
- [ ] Tables scroll horizontally on mobile (`overflow-x: auto` wrapper) rather than breaking layout

---

## Testing and quality gates

- **Unit/component tests:** `npm test` / `vitest run`; setup in `src/__tests__/setup.ts`.
- **Lint:** `npm run lint`.
- **Build:** `npm run build` before large releases.

Add tests for non-trivial logic (utils, services where mockable, critical UI behaviour). New interactive components should have at minimum a render smoke test and a keyboard-navigation test.

---

## Supabase Edge Functions (ops)

- `npm run supabase:deploy:all` — deploy all functions (see `package.json` for project ref).
- Shared code: `supabase/functions/_shared/` — add reusable Deno helpers here (CORS, email templates, etc.).
- All transactional email goes through the `send-email` Edge Function. Do **not** add new email-sending code to Next.js API routes.

---

## Images and Next.js

`next.config.ts` allows Supabase Storage URLs for `uccivcdtfpevtykirkuw.supabase.co` under `/storage/v1/object/public/**`. If using another bucket/host, update `remotePatterns`. Always use `next/image` for user-visible images; set `alt`, `width`, `height` (or `fill` + `sizes`).

---

## Agent workflow (best practices)

1. **Scope:** Change only what the task requires; match surrounding patterns (imports, error handling, MUI usage).
2. **Auth:** Any new `/dashboard` route is already protected by middleware; still validate permissions in RLS and/or server code where data is sensitive.
3. **Secrets:** Supabase service-role key goes **only in Supabase Edge secrets** (scraper). Resend keys go in the app host (Vercel) for the email API routes. **Never** add `SUPABASE_SERVICE_ROLE_KEY` to the Next.js environment.
4. **Migrations:** Prefer SQL migrations under `supabase/migrations/` for schema changes; keep RLS policies in mind. Use `SECURITY DEFINER` RPCs for privileged reads that must remain under user-session auth.
5. **Accessibility:** Run through the WCAG AAA checklist in this document before considering any UI task complete.
6. **Responsiveness:** Verify all four breakpoints (`xs` / `sm` / `md` / `lg`) before considering any UI task complete.
7. **Copy:** Preserve Romanian UI tone where the rest of the screen is Romanian unless the task is explicitly to translate.

---

## Quick commands

```bash
npm run dev          # Next.js dev server
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest (once)
npm run test:watch   # Vitest watch mode
npm run supabase:deploy:all   # Deploy all Edge Functions
```
