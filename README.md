# LegalJobs — Platformă de carieră juridică

A production-grade job board for the Romanian legal industry built with **Next.js 16** (App Router, SSG/ISR) and **Supabase** (Auth, PostgreSQL, Storage).

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 · React 19 · TypeScript (strict) |
| UI | MUI v7 + Emotion (`sx` prop, `@emotion/styled`) |
| Global CSS | Tailwind CSS v4 |
| Forms | react-hook-form v7 + Zod + `@hookform/resolvers` |
| Rich text | TipTap |
| Auth & data | Supabase (`@supabase/supabase-js`, `@supabase/ssr`) |
| Email | Resend (Supabase **Edge Functions** — `send-email`, `notifications`, `job-application`, … — see **`AGENTS.md`**) |
| Charts | Recharts |
| Motion | Framer Motion |
| Markdown | react-markdown |
| Tests | Vitest + jsdom + Testing Library |
| Lint | ESLint 9 flat config · `eslint-config-next` (core-web-vitals + typescript) |

---

## Feature flags

**Static product gates** — `src/config/app.settings.json` → `features` (blog, alerts, messages, notifications, archive, matchmaking, etc.). Use **`src/lib/feature-flags.ts`** (`isFeatureEnabled`, `assertFeatureEnabled`) in code; middleware may duplicate guards for sensitive routes (e.g. blog).

**Runtime experimentation** — Job and company **favourites** use the Flags SDK (`src/flags.ts`, `favouritesFlag`) with `FLAGS` / `FLAGS_SECRET` from Vercel when configured — see **`/AGENTS.md`** and `.agents/skills/flags-sdk/SKILL.md`.

Canonical brand name and numeric defaults live in the same JSON file (`name`, `brand`, `config`). UI copy remains Romanian in source.

---

## Getting started

### Prerequisites

- Node.js 18+
- npm
- Supabase project (cloud or local CLI)

### 1 — Install dependencies

```bash
git clone <repo-url>
cd jobboard
npm install
```

### 2 — Configure environment variables

Use a **single local file**: **`.env`** (gitignored). Remove any legacy **`.env.vercel.flags`** (merge is into `.env` only).

1. Copy the template:

   ```bash
   cp .env.example .env
   ```

2. Fill in Supabase URL, anon key, site URL, and (for CLI scripts) `SUPABASE_ACCESS_TOKEN` / `SUPABASE_DB_PASSWORD`.

3. If the project is linked to Vercel (`npx vercel link`), merge dashboard env into `.env` **without** overwriting the keys above:

   ```bash
   npm run vercel:env
   ```

   This runs `vercel env pull` to a temp file, then merges into `.env`. The pre-commit hook uses the same merge when you commit.

`dotenv` in **scripts** and **E2E** loads **`.env`**.

> **Security note:** `SUPABASE_SERVICE_ROLE_KEY` is **not** used by the Next.js app. It lives exclusively in Supabase Edge Function secrets. Never add it to `.env` or Vercel environment variables for the web app.

### 3 — Apply database migrations

```bash
supabase db push
```

Or paste the files in `supabase/migrations/` into the Supabase Dashboard SQL Editor in chronological order.

After schema changes, refresh TypeScript + Zod mirrors (also runs on **`git pull`** / **`git commit`** via hooks unless `SKIP_CODEGEN=1`):

```bash
npm run codegen
```

Uses `supabase gen types --linked` when the directory is linked, or set **`SUPABASE_PROJECT_ID`** in `.env` (see `.env.example`). If remote generation skips, `database.ts` is left as-is and **supazod** still updates **`src/types/database.zod.ts`**.

### 4 — Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
src/
├── app/
│   ├── (public)/             # Marketing + job board (unauthenticated)
│   ├── (auth)/               # login, register, verify-email, OAuth consent
│   ├── dashboard/            # Protected app shell (middleware enforces session)
│   ├── api/                  # Route handlers — currently jobs/apply-internal-form
│   ├── layout.tsx            # Root layout: ThemeRegistry, ToastProvider, Navbar, Footer
│   ├── page.tsx              # Homepage
│   └── …                     # sitemap, robots, error boundaries, flags discovery route
├── components/               # Feature UI — see src/AGENTS.md Architecture Overview
├── hooks/                    # useAuth, useSupabase, useAsyncData, useRole, useFavourites, …
├── contexts/                 # ToastContext (global ephemeral feedback)
├── lib/                      # Supabase factories, SEO, feature-flags, notifications helpers
├── services/                 # *.service.ts — preferred home for .from / .rpc / storage (see src/AGENTS.md)
├── theme/
├── types/
├── config/
│   └── app.settings.json
├── AGENTS.md                 # /src patterns (companion to repo-root AGENTS.md)
└── PATTERNS.md               # Pattern Index + snippets

supabase/
├── migrations/
└── functions/                # Edge Functions (email, notifications, cron — see AGENTS.md)
```

**Implementor docs:** **`src/AGENTS.md`** (rules) · **`src/PATTERNS.md`** (examples + reference file paths per pattern).

---

## Database schema

Key tables (see Supabase Dashboard → Table Editor for the full schema):

| Table | Purpose |
|-------|---------|
| `profiles` | Extends `auth.users` — candidate public profile |
| `companies` | Company info + slug + logo |
| `company_users` | Many-to-many with roles: `owner`, `admin`, `member` |
| `job_listings` | Postings with full-text `search_vector`, RLS |
| `applications` | Candidate ↔ job relation, status tracking |
| `forms` / `form_fields` | Custom application form builder |
| `form_responses` / `form_response_values` | Submitted form data |
| `favorites` | Saved jobs per user |
| `alerts` | Saved search filters |
| `conversations` / `messages` | Real-time messaging |
| `notifications` | Per-user notification feed |
| `profile_experience` / `profile_education` / `skills` | CV sections |

### RPC functions (SECURITY DEFINER)

| Function | Purpose |
|----------|---------|
| `application_notification_recipient(p_job_id)` | Returns the first company contact email/name for a job the calling user has applied to — used by Edge / server paths instead of a service-role client in the browser |
| `is_company_member(p_company_id, p_min_role?)` | Checks company membership in RLS policies |
| `company_has_no_owner(p_company_id)` | Guard for company creation |
| `increment_company_visits(p_company_id)` | Fire-and-forget view counter |
| `increment_company_engages(p_company_id)` | Fire-and-forget engagement counter |

---

## Authentication

- **Email/password** — sign-up, login, password recovery.
- **Email verification** — users land on `/dashboard` immediately after registration; an `EmailVerificationBanner` (in the dashboard layout) prompts them to verify and offers a one-click resend via `useAuth().resendVerification()`.
- **Social OAuth** — `SocialButtons` component; callback at `/auth/callback`.
- **Middleware-enforced routes** — `/dashboard/*` requires a valid session; `/login` and `/register` redirect authenticated users to `/dashboard`.

---

## Email notifications

Transactional email is delivered through **[Resend](https://resend.com)** from **Supabase Edge Functions** (`supabase/functions/` — shared HTML in `_shared/templates/`). Callers use **`supabase.functions.invoke(...)`** with the **user JWT** (or cron secrets for scheduled jobs). **`SUPABASE_SERVICE_ROLE_KEY`** and **`RESEND_*`** live **only** in Supabase Edge secrets — never in the Next.js env.

**Examples:**

| Flow | Typical caller |
|------|----------------|
| Job application emails | `job-application` Edge Function after apply · `POST /api/jobs/apply-internal-form` may invoke it |
| Typed user notifications | `notifications` Edge Function — prefer **`dispatchNotification`** from `src/lib/notifications/dispatch.ts` |
| Profile / company transactional | `send-email` Edge Function (`profile_updated`, `company_created`, …) |

Privileged reads (e.g. resolving the poster's contact for mail) use **`SECURITY DEFINER`** RPCs such as **`application_notification_recipient`** — not a service-role client in Next.js.

Full inventory and payloads: **`AGENTS.md`** → *Transactional email* and *Edge Functions inventory*.

---

## Public job-posting wizard (`/anunt`)

A four-step client-side wizard at `/anunt` for new employers who don't yet have a dashboard account:

| Step | Content |
|------|---------|
| 1 — Anunț | Job details (title, description, type, salary, benefits, application method) |
| 2 — Companie | Company details + logo upload |
| 3 — Cont | Login / register (skipped if already authenticated) |
| 4 — Confirmare | Preview with inline edit jump-backs, then publish |

On publish: company → logo upload → job → benefits → email notification → redirect to the live job page. A full-screen loading overlay with rotating legal-humour messages plays during creation.

---

## UI notifications

Canonical rules live in **`AGENTS.md`** → *UI notification patterns*. Quick snippets: **`src/PATTERNS.md`** → *Ephemeral feedback — `useToast`*.

There are **two distinct notification mechanisms**. Use the right one for the job.

### 1 — `useToast` — ephemeral feedback toasts (always use this)

`ToastProvider` is mounted once in the root layout (`src/app/layout.tsx`). It renders a single global `<Snackbar>`. Any component or custom hook anywhere in the tree can trigger a toast without rendering its own `<Snackbar>`.

```tsx
import { useToast } from "@/contexts/ToastContext";

export function MyComponent() {
  const { showToast } = useToast();

  const handleSave = async () => {
    await save();
    showToast("Salvat cu succes.");                    // success, 3500 ms
    showToast("Anunț arhivat.", "info");               // info, 3500 ms
    showToast("A apărut o eroare.", "error", 5000);    // error, 5 s
  };
}
```

**Signature:** `showToast(message: string, severity?: "success" | "error" | "warning" | "info", duration?: number)`

**Rules:**
- Default severity is `"success"`, default duration is `3500 ms`.
- Use `"info"` for neutral state-change feedback (archive, favourite toggle, filter applied).
- Use `"error"` with a longer duration (5000 ms) so the user has time to read it.
- Do **not** create component-local `useState` + `<Snackbar>` for transient feedback. The `EditSideDrawer` `message` prop is still valid for persistent in-drawer errors (e.g. validation failures that must stay visible while the form is open).

### 2 — `useNotifications` — persisted DB notification feed

`useNotifications` reads and subscribes to the `notifications` table in real time. It powers the `NotificationBell` in the dashboard navbar. It is **not** for transient UI feedback.

```tsx
import { useNotifications } from "@/hooks/useNotifications";

const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
```

Only use this hook inside `NotificationBell` or a dedicated notification-feed component.

### What was removed

`src/hooks/useNotification.ts` (singular) was a local-state alternative to `useToast` that was created during the initial cleanup pass but was never wired to any component. It has been **deleted** to eliminate the ambiguity. `useToast` is the single source of truth for ephemeral UI feedback.

---

## UI conventions

### Dashboard — side drawer pattern

All create/edit flows in the dashboard use `EditSideDrawer` (`src/components/layout/EditSideDrawer.tsx`), not separate pages.

```tsx
import { EditSideDrawer } from "@/components/layout/EditSideDrawer";

<EditSideDrawer
  open={drawerOpen}
  onClose={closeDrawer}
  title="Editează compania"
  message={message}
  onMessageClose={() => setMessage(null)}
>
  <AddEditCompany ... />
</EditSideDrawer>
```

Used in: `dashboard/company`, `dashboard/jobs`, `dashboard/profile`, `dashboard/forms`.

**Do not create separate `/new` or `/[id]/edit` pages** for entities managed in the dashboard.

### Wizard / public forms — full-page steps

The `/anunt` wizard and any future public multi-step flows use a full-page `Stepper` (MUI) + `Paper` card layout, not the side drawer.

---

## Accessibility

All pages and components target **WCAG 2.2 Level AAA**. See `AGENTS.md` for the full checklist. Key rules:

- Text contrast ≥ **7 : 1**.
- Every icon-only button has `aria-label`.
- Forms: visible `<label>` per field, errors linked via `aria-describedby`.
- Framer Motion animations respect `prefers-reduced-motion`.
- One `<h1>` per page; no skipped heading levels.
- All interactive elements reachable and operable by keyboard alone.

---

## Responsive design

Four breakpoints are used throughout (MUI defaults):

| Tier | Range | Target |
|------|-------|--------|
| Mobile | `xs` 0–599 px | Phones |
| Tablet | `sm` 600–899 px | Small tablets, landscape phones |
| Desktop | `md` 900–1199 px | Laptops |
| Large desktop | `lg` 1200 px + | Wide monitors |

All components must render without horizontal scroll at 360 px and be tested at all four tiers before merging.

---

## Scripts

```bash
npm run dev                   # Next.js dev server (http://localhost:3000)
npm run build                 # Production build
npm run codegen               # database.ts (CLI) + database.zod.ts (supazod)
npm run lint                  # ESLint
npm test                      # Vitest (single run)
npm run test:watch            # Vitest watch mode
npm run supabase:deploy:all   # Deploy all Edge Functions
```

---

## Deployment

### Vercel (recommended)

```bash
npx vercel
```

Set environment variables in the Vercel dashboard (web app):

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata and auth redirects |
| `FLAGS` / `FLAGS_SECRET` | Optional — Vercel Flags / Toolbar (`npm run vercel:env` merges into `.env`) |

**Do not add `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, or `RESEND_FROM` to Vercel** for this project — they belong in **Supabase Edge Function secrets** (see **`AGENTS.md`** environment table).

### Edge Functions

```bash
npm run supabase:deploy:all
```

Set these secrets in the Supabase Dashboard → Edge Functions → Secrets:

| Secret | Used by |
|--------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | All notification Edge Functions (`notifications`, `job-application`, etc.) |
| `CRON_SECRET` | `jobs-lifecycle` — scheduler must send `Authorization: Bearer <value>` |
| `RESEND_API_KEY` | `send-email`, `notifications` |
| `RESEND_FROM` | `send-email`, `notifications` |
| `NEXT_PUBLIC_SITE_URL` | All Edge Functions that build email links |

---

## Language

Toată interfața utilizatorului este în **limba română**. Textele vizibile (etichete, validări Zod, mesaje de eroare, butoane, placeholder-uri) sunt definite direct în cod în română. Nu există un sistem i18n — dacă în viitor se dorește suport multi-limbă se recomandă `next-intl`.

Fișiere cheie pentru copy-ul de interfață:

| Fișier | Conținut |
|--------|----------|
| `src/lib/utils.ts` | Etichete contract, experiență, formatare dată/salariu |
| `src/components/layout/` | Navbar, Footer, HeroSection, FeaturesSection, JobCtaBanner |
| `src/components/jobs/` | Filtre, liste, detalii, formular aplicare |
| `src/components/auth/` | LoginForm, SocialButtons |
| `src/app/(auth)/register/page.tsx` | Înregistrare |
| `src/app/(public)/anunt/AnuntWizard.tsx` | Wizard publicare anunț |
| `src/app/dashboard/` | Paginile din tabloul de bord (segment protejat de middleware) |

---

## License

Private — SOLON Agency
