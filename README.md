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
| Email | Resend (via Next.js Route Handlers) |
| Charts | Recharts |
| Motion | Framer Motion |
| Markdown | react-markdown |
| Tests | Vitest + jsdom + Testing Library |
| Lint | ESLint 9 flat config · `eslint-config-next` (core-web-vitals + typescript) |

---

## Feature flags

Controlled in `src/config/app.settings.json`:

| Feature | Status |
|---------|--------|
| Job listings (CRUD, search, SSG) | ✅ Enabled |
| Company profiles (SSG) | ✅ Enabled |
| Application forms (custom form builder) | ✅ Enabled |
| Job archive | ✅ Enabled |
| Public wizard (`/anunt`) for new employers | ✅ Enabled |
| Job alerts | ⛔ Disabled |
| Real-time messaging | ⛔ Disabled |
| In-app notifications | ⛔ Disabled |
| Favourite jobs / companies | ⛔ Disabled |

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

Create `.env.local` (never commit this file):

```bash
# ── Required ──────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ── Transactional email (Resend) ──────────────────────────
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM="LegalJobs <noreply@yourdomain.com>"
```

> **Security note:** `SUPABASE_SERVICE_ROLE_KEY` is **not** used by the Next.js app. It lives exclusively in Supabase Edge Function secrets for the `scrape-jobs` function. Never add it to `.env.local` or Vercel environment variables for the web app.

### 3 — Apply database migrations

```bash
supabase db push
```

Or paste the files in `supabase/migrations/` into the Supabase Dashboard SQL Editor in chronological order.

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
│   ├── (public)/               # Unauthenticated pages
│   │   ├── page.tsx            # Homepage
│   │   ├── jobs/               # Job listing + detail ([slug])
│   │   ├── companies/[slug]/   # Company public profile
│   │   ├── users/[slug]/       # Candidate public profile
│   │   ├── anunt/              # Multi-step job-posting wizard
│   │   ├── how-it-works/
│   │   └── policy/
│   ├── (auth)/                 # Login, register, OAuth callback
│   ├── (dashboard)/            # Protected — requires authentication
│   │   └── dashboard/
│   │       ├── page.tsx        # Overview
│   │       ├── jobs/           # Job CRUD
│   │       ├── company/        # Company CRUD
│   │       ├── profile/        # Candidate profile
│   │       ├── applications/   # Received / sent applications
│   │       ├── forms/          # Custom application form builder
│   │       ├── archive/        # Archived jobs & companies
│   │       ├── alerts/         # Saved search alerts (flag-guarded)
│   │       └── messages/       # Messaging (flag-guarded)
│   └── api/
│       ├── jobs/notify-application/    # POST — send application emails
│       ├── jobs/apply-internal-form/   # POST — submit form application
│       ├── profile/notify-updated/     # POST — send profile-update email
│       └── companies/notify-created/  # POST — send company-created email
├── components/
│   ├── auth/           # LoginForm, SocialButtons
│   ├── chat/           # ChatWindow
│   ├── companies/      # CompanyDescription, CompanyJobList, CompanyPageTracker
│   ├── dashboard/      # DashboardNav, DashboardPageHeader, DashboardContent,
│   │                   # EmailVerificationBanner
│   ├── editor/         # RichTextEditor (TipTap)
│   ├── forms/          # All form components (dashboard CRUD + application flow)
│   │   ├── AddEditCompany.tsx
│   │   ├── AddEditForm.tsx   # Form-builder UI (custom application forms)
│   │   ├── AddEditJob.tsx
│   │   ├── ApplicationForm.tsx
│   │   └── validations/      # Zod schemas + TS types, one file per form domain
│   │       ├── company.schema.ts
│   │       ├── job.schema.ts
│   │       └── form-builder.schema.ts
│   ├── jobs/           # JobCard, JobRow, JobList, JobDetail, JobDetailWrapper,
│   │                   # JobFilters, JobTags, JobsCarousel, ApplyButton
│   ├── layout/         # Navbar, Footer, HeroSection, FeaturesSection,
│   │                   # JobCtaBanner, EditSideDrawer
│   ├── notifications/  # NotificationBell
│   └── profile/        # EditEducation, EditExperience, EditSkills,
│                        # EducationTimeline, ExperienceTimeline, SkillsDisplay
├── hooks/
│   ├── useAuth.ts          # Session, signIn, signUp, signOut, resendVerification
│   ├── useSupabase.ts      # Browser Supabase client singleton
│   ├── useMessages.ts
│   └── useNotifications.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Browser client ("use client" only)
│   │   ├── server.ts       # Server Components / Route Handlers / Actions
│   │   ├── static.ts       # Anon client for ISR/SSG pages
│   │   └── middleware.ts   # Session refresh + auth redirects
│   ├── email/
│   │   ├── resend.ts                           # HTML template builder + Resend transport
│   │   ├── send-application-notification.ts
│   │   ├── send-company-created-notification.ts
│   │   └── send-profile-updated-notification.ts
│   ├── utils.ts            # slugify, formatSalary, formatDate, timeAgo, label maps
│   └── seo.ts
├── services/               # Data-access layer — each function receives a SupabaseClient
│   ├── jobs.service.ts
│   ├── companies.service.ts
│   ├── applications.service.ts
│   ├── forms.service.ts
│   ├── benefits.service.ts
│   ├── experience.service.ts
│   ├── education.service.ts
│   ├── skills.service.ts
│   ├── alerts.service.ts
│   ├── messages.service.ts
│   └── notifications.service.ts
├── theme/                  # MUI ThemeRegistry, palette, component overrides
├── types/
│   ├── database.ts         # Supabase-generated types + hand-maintained RPCs
│   └── index.ts            # Shared app types (JobSearchFilters, PaginatedResponse…)
└── config/
    └── app.settings.json   # Brand colors, feature flags, salary defaults

supabase/
├── config.toml
├── migrations/
│   ├── 20260406180000_applicant_form_application_rls.sql
│   └── 20260409120000_secure_applicant_reads_and_notify_rpc.sql
└── functions/
    └── hello-worlds/       # test edge function
```

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
| `application_notification_recipient(p_job_id)` | Returns the first company contact email/name for a job the calling user has applied to — used by the notification API route instead of a service-role client |
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

All transactional emails are sent from **Next.js Route Handlers** using [Resend](https://resend.com). There is no service-role key in the web app.

| Event | API route | Helper |
|-------|-----------|--------|
| Job application submitted | `POST /api/jobs/notify-application` | `send-application-notification.ts` |
| Candidate profile updated | `POST /api/profile/notify-updated` | `send-profile-updated-notification.ts` |
| Company created | `POST /api/companies/notify-created` | `send-company-created-notification.ts` |

Poster email resolution uses a `SECURITY DEFINER` Postgres RPC (`application_notification_recipient`) so the app never needs a service-role client.

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

Set **server-side** environment variables in the Vercel dashboard:

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public |
| `NEXT_PUBLIC_SITE_URL` | e.g. `https://legaljobs.ro` |
| `RESEND_API_KEY` | Server only |
| `RESEND_FROM` | Server only, e.g. `"LegalJobs <noreply@legaljobs.ro>"` |

**Do not add `SUPABASE_SERVICE_ROLE_KEY` to Vercel.** It belongs only in Supabase Edge Function secrets.

### Edge Functions

```bash
npm run supabase:deploy:all
```

Set these secrets in the Supabase Dashboard → Edge Functions → Secrets:

| Secret | Used by |
|--------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | `scrape-jobs` only |
| `CRON_SECRET` | `scrape-jobs` — scheduler must send `Authorization: Bearer <value>` |
| `RESEND_API_KEY` | Legacy (now unused; email is sent from Next.js) |
| `RESEND_FROM` | Legacy |
| `SITE_URL` | Legacy |

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
| `src/app/(dashboard)/dashboard/` | Toate paginile din tabloul de bord |

---

## License

Private — SOLON Agency
