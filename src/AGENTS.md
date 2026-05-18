# Agent Guide — /src

Companion to `/AGENTS.md` at the repo root. Use this file for code-level patterns
(the root AGENTS.md covers higher-level product, Supabase secrets, and ops).

---

## Documentation map (keep in sync)

| Doc | Audience | Purpose |
|-----|----------|---------|
| `/AGENTS.md` | Everyone | Product context, WCAG, notifications UX rules, Edge Functions inventory, env/secrets |
| `/README.md` | Humans onboarding | Setup, scripts, high-level structure |
| **`src/AGENTS.md`** (this file) | Implementors | `/src` conventions, services/forms/server-client split |
| **`src/PATTERNS.md`** | Implementors | Copy-paste snippets; must match patterns declared here and in `/AGENTS.md` |

**When you add or change a cross-cutting pattern**, update **both** `src/AGENTS.md` and `src/PATTERNS.md` in the same PR (and `/AGENTS.md` or `/README.md` if onboarding or product rules change). When you add a **vertical feature** (e.g. alerts, blog), link its entry points (`page.tsx`, main `*Client.tsx`, services) from `src/PATTERNS.md` Pattern Index if it becomes a reference implementation.

---

## Architecture Overview

```
src/
  app/                  # Next.js App Router
    (auth)/             # Login, register, verify-email, OAuth consent
    (public)/           # Public-facing job board pages
    api/                # Route Handlers (POST /api/jobs/apply-internal-form)
    dashboard/          # Authenticated dashboard (middleware protects /dashboard/*)
  components/
    auth/               # LoginForm, RegisterForm, SocialButtons
    common/             # Shared presentational: PageContainer, BorderedCard, EmptyState, FormFieldError
    dashboard/          # DashboardContent, DashboardNav, DashboardPageHeader, EmailVerificationBanner
    editor/             # RichTextEditor (TipTap)
    forms/              # CRUD forms (AddEditJob, AddEditCompany, AddEditEducation, AddEditExperience,
    │                   #             ApplicationForm, WithdrawApplicationForm, AddEditForm)
    │   validations/    # Zod schemas — ONE file per domain
    jobs/               # JobCard, JobDetail, JobList, JobRow, JobFilters, JobsCarousel,
    │                   # ApplyButton, JobTags, JobDetailWrapper
    layout/             # Navbar, Footer, HeroSection, FeaturesSection, EditSideDrawer, JobCtaBanner
    notifications/      # NotificationBell
    profile/            # EditSkills, EducationTimeline, ExperienceTimeline
  hooks/                # Client-only custom hooks
  store/                # Redux Toolkit store, RTK Query API slices (Supabase-backed queries)
  lib/                  # Shared utilities (non-React)
  services/             # All Supabase queries live here, NOT in pages/components
  theme/                # MUI theme (palette, components overrides, ThemeRegistry)
  types/                # database.ts (+ codegen), database.zod.ts (supazod), index.ts (app types)
```

---

## Supabase Patterns

### Creating Clients

```ts
// Browser (client component / hook):
import { createClient } from "@/lib/supabase/client";
// OR use the hook which is preferred for components:
import { useSupabase } from "@/hooks/useSupabase";
const supabase = useSupabase(); // memoized singleton

// Server Component / Route Handler / Server Action:
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();

// Static/ISR pages (no cookies, anon):
import { createStaticClient } from "@/lib/supabase/static";
const supabase = createStaticClient();

// Middleware (updateSession only):
import { updateSession } from "@/lib/supabase/middleware";
```

**Rule:** Never create a Supabase client directly in a component that is not a hook.
Use `useSupabase()` in client components and `await createClient()` in server code.

### Querying Data (Always via a service)

All `.from(...)`, `.rpc(...)`, `.storage`, and `.auth` calls live in `src/services/*.service.ts`.
Pages and components call service functions — they do NOT call `supabase.from(...)` directly.

**ESLint:** Config block `supabase-from-boundary` in `eslint.config.mjs` flags `.from(` calls (including `storage.from`) outside allowed paths; `Array.from` is allowed. Exemptions and grandfathered files live in `eslint/supabase-from-boundary-allowlist.mjs` — remove entries as you migrate callers into services.

```ts
// src/services/jobs.service.ts — template for a service query
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

/**
 * Description of what this fetches.
 *
 * RLS: describe which policy allows this (e.g. "anon can select published jobs").
 */
export const getPublishedJobs = async (
  supabase: SupabaseClient<Database>,
  filters: JobSearchFilters
): Promise<Tables<"job_listings">[]> => {
  const { data, error } = await supabase
    .from("job_listings")
    .select("*")
    .eq("status", "published");

  if (error) throw error;
  return data ?? [];
};
```

Always destructure `{ data, error }` and throw/handle `error` before using `data`.

### Invoking Edge Functions

```ts
// From a client component:
void supabase.functions
  .invoke("send-email", { body: { event: "profile_updated" } })
  .catch((err: unknown) => console.warn("send-email:", err));

// From the apply route handler (with auth token forwarding):
const { data: { session } } = await supabase.auth.getSession();
const invokeOpts = session?.access_token
  ? { body: { job_id }, headers: { Authorization: `Bearer ${session.access_token}` } }
  : { body: { job_id } };
void supabase.functions.invoke("job-application", invokeOpts);
```

Full inventory, payloads, and cron/auth notes: **`/AGENTS.md`** → section *Edge Functions inventory*.

---

## Form Pattern

Every form must follow this pattern — no exceptions.

```ts
// 1. Schema in src/components/forms/validations/<domain>.schema.ts
import { z } from "zod";
export const jobSchema = z.object({
  title: z.string().min(3, "Titlul trebuie să aibă cel puțin 3 caractere"),
});
export type JobFormData = z.infer<typeof jobSchema>;

// 2. Component
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobSchema, type JobFormData } from "@/components/forms/validations/job.schema";

export function JobForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JobFormData>({ resolver: zodResolver(jobSchema) });

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <TextField
        {...register("title")}
        label="Titlu"
        error={!!errors.title}
        helperText={errors.title?.message}
        aria-describedby="title-error"
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Se salvează..." : "Salvează"}
      </Button>
    </Box>
  );
}
```

Schemas live in `src/components/forms/validations/<domain>.schema.ts`.
Use `superRefine` for cross-field rules (see `experience.schema.ts`).

### DB-aligned Zod (generated)

**Hand-written form schemas stay the UX boundary** (Romanian messages, `superRefine`, trimmed fields).
For **Insert/Update/Row parity** with Postgres, import from **`src/types/database.zod.ts`** (generated by **supazod** from `database.ts`). Example: narrow a payload before a service call with `publicJobListingsInsertSchema.pick({ … })`, or reuse enum schemas such as `publicJobStatusSchema`.

Regenerate whenever types change:

- **`npm run codegen`** — `codegen:types` (Supabase CLI, best-effort when linked or `SUPABASE_PROJECT_ID` is set) then `codegen:zod` (**supazod**, **`public` schema only**) plus a tiny **`patch-database-zod-json`** pass so recursive `jsonSchema` type-checks under strict TS.
- **Git hooks** — `.githooks/pre-commit` and `.githooks/post-merge` run `npm run codegen` unless `SKIP_CODEGEN=1`.

---

## Component Conventions

### Server vs Client Components

Apply `"use client"` only if the component needs one of:
- React hooks (`useState`, `useEffect`, `useCallback`, etc.)
- Event handlers passed inline
- Browser-only APIs (`window`, `localStorage`, etc.)
- Client-only libraries (TipTap, Framer Motion, chart libraries)

**Decision tree:**
```
Does it use hooks, event handlers, or browser APIs?
  YES → add "use client" at the top
  NO  → leave it as a Server Component (default)
```

Dashboard `page.tsx` files are **server components** that export `metadata` and render
a `*Client.tsx` body component (which has "use client"). See `dashboard/profile/page.tsx`.

### File Naming

| Artifact | Convention | Example |
|---|---|---|
| Components | `PascalCase.tsx` | `JobCard.tsx` |
| Hooks | `useDescriptiveName.ts` | `useAuth.ts`, `useToast`-related contexts |
| Services | `<domain>.service.ts` | `jobs.service.ts` |
| Validations | `<domain>.schema.ts` | `job.schema.ts` |
| Client body (split pages) | `<PageName>Client.tsx` | `ProfileClient.tsx` |

---

## State Management

**Redux Toolkit + RTK Query** (`@reduxjs/toolkit`, `react-redux`) power **cached client-side server state**. Store wiring lives in **`src/store/`**; **`ReduxStoreProvider`** mounts inside **`src/app/layout.tsx`** (wraps the tree below **`ThemeRegistry`**) and injects the browser Supabase client via thunk **`extraArgument`** (`getSupabase`) so endpoints stay thin wrappers around **`src/services/*`**.

Other state lives in:
- **React component state** for local UI
- **Supabase session** via **`useAuth()`** for auth state
- **Server Components / RSC pages** — fetch via **`createClient()`** + **`src/services/*`**, pass serializable props into `"use client"` children when that avoids a redundant round-trip
- **Legacy client-only loads** still using **`useState` + `useEffect`** elsewhere — migrate to **RTK Query** incrementally (mirror **`employerJobsDashboard`** + **`jobBoardApi.util.invalidateTags`**)
- **URL search params** for filter state on public listings (and similar)

`useAuth()` — `user`, sign-in/up/out, etc. **`useSupabase()`** — memoized browser Supabase client.

**Ephemeral UI feedback** — **`useToast()`** from `src/contexts/ToastContext.tsx` only (see `/AGENTS.md` → *UI notification patterns*). Do not add `useNotification` (removed).

---

## API Routes

Only one route handler exists: `POST /api/jobs/apply-internal-form`.

**Template for new route handlers:**
```ts
// src/app/api/<resource>/<action>/route.ts
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return apiError("Trebuie să fii autentificat.", 401);

  // ... validation and data operations ...

  return apiSuccess({ ok: true });
}
```

Error shape: `{ error: string, code?: string }` with HTTP status code.
Success shape: any serializable object.

---

## Animation (Framer Motion)

Import shared variants from `src/lib/motion.ts`:

```tsx
import { fadeUp, stagger, heroContainer, heroItem } from "@/lib/motion";
import { motion, useReducedMotion } from "framer-motion";

// Always respect prefers-reduced-motion:
const reduced = useReducedMotion();

<motion.div
  variants={fadeUp}
  initial="hidden"
  whileInView="visible"
  custom={0}
  transition={{ duration: reduced ? 0 : undefined }}
/>
```

Available: `fadeUp`, `stagger`, `heroContainer`, `heroItem`, `statsContainer`,
`slideVariantsFull`, `slideVariantsReduced`, `carouselTransition`.

---

## Shared Components

| Component | Location | Purpose |
|---|---|---|
| `PageContainer` | `components/common/PageContainer.tsx` | Responsive Container with preset `py` per page type |
| `BorderedCard` | `components/common/BorderedCard.tsx` | `Paper variant="outlined"` with consistent border style |
| `EmptyState` | `components/common/EmptyState.tsx` | Centered empty list placeholder |
| `FormFieldError` | `components/common/FormFieldError.tsx` | Accessible RHF error display |

---

## Shared Hooks & providers

| Hook / provider | Location | Purpose |
|---|---|---|
| **`useToast`** | `contexts/ToastContext.tsx` | Global ephemeral snackbar (`ToastProvider` in `src/app/layout.tsx`) |
| **`useAsyncData`** | `hooks/useAsyncData.ts` | Optional generic loading/error/reload wrapper for client fetchers — **prefer for new code**; legacy screens may still use manual `useEffect` loads |
| **`useAuth`** | `hooks/useAuth.ts` | Supabase auth state + actions |
| **`useSupabase`** | `hooks/useSupabase.ts` | Memoized browser Supabase client |
| **`useRole`** | `hooks/useRole.ts` | Role + employer/admin derived flags |
| **`useFavourites`** | `hooks/useFavourites.ts` | Job/company favourites (depends on flags + toast) |
| **`useMessages`** | `hooks/useMessages.ts` | Realtime messaging (`messages` table) — feature-flagged |
| **`useNotifications`** | `hooks/useNotifications.ts` | Realtime **`notifications`** table feed for bell UI — not for transient toasts |

---

## Adding a New Feature

1. **Types:** Add/extend columns in `src/types/database.ts`, then **`npm run codegen`** (updates **`database.zod.ts`**).
2. **Schema:** Add Zod schema in `src/components/forms/validations/<domain>.schema.ts`.
3. **Service:** Add service functions in `src/services/<domain>.service.ts`. Annotate with RLS comment.
4. **Component:** Create `src/components/<feature>/<Component>.tsx`. Use named export. Add `"use client"` only if needed.
5. **Form (if needed):** Create `src/components/forms/AddEdit<Domain>.tsx` following the RHF+Zod pattern.
6. **Page:** `src/app/dashboard/<feature>/page.tsx` (server shell with `metadata`) + `*Client.tsx` body.
7. **API route (if needed):** `src/app/api/<resource>/<action>/route.ts`. Use `apiSuccess`/`apiError`.
8. **Tests:** `src/__tests__/<domain>.test.ts` — at minimum a smoke test and key behaviour.
9. **Docs:** If the feature introduces a new pattern, add a row to **`src/PATTERNS.md`** Pattern Index and one line in **Documentation map** above if needed.

---

## Do Not

These anti-patterns were found and removed during the cleanup pass (2026-04-23):

| Anti-pattern | Correct approach |
|---|---|
| Inline Zod schema inside a component | Move to `validations/<domain>.schema.ts` |
| `React.FC<Props>` type annotation | Use `function Name(props: Props) {}` |
| `createClient()` called in multiple places within same component | Use `useSupabase()` hook once |
| `supabase.from(...)` called directly in a page or component | Call a service function instead *(legacy violations exist — fix when touching the file)* |
| `export type { Database, Tables }` re-exported via `@/types` barrel | Import directly from `@/types/database` |
| Deleted service files re-created: `messages.service.ts`, `notifications.service.ts` | `useMessages`/`useNotifications` hooks handle these directly |
| Orphaned components re-created: `ChatWindow`, `CompanyJobList`, `GradientText`, `SkillsDisplay` | These were unused — check before adding similar UI |
| Missing `noValidate` on `<Box component="form">` | Add `noValidate` to every RHF form |
| Framer Motion variants defined inline per-component | Import from `@/lib/motion` |
| Default export from a shared component | Use named exports for all shared components |
| `job-application` invoked in prod without the function deployed | Deploy functions (`npm run supabase:deploy:all`); verify `supabase/functions/job-application/` exists in repo |
| Manual `useState` validation in forms (`AddEditForm.tsx`) | Migrate to `useForm + zodResolver` (marked TODO) |
| Component-local `<Snackbar>` for transient success/error | Use **`useToast`**; keep drawer **`message`** for persistent in-drawer errors (see `/AGENTS.md`) |
