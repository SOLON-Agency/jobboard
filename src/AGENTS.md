# Agent Guide — /src

Companion to `/AGENTS.md` at the repo root. Use this file for code-level patterns
(the root AGENTS.md covers higher-level product, Supabase secrets, and ops).

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
  lib/                  # Shared utilities (non-React)
  services/             # All Supabase queries live here, NOT in pages/components
  theme/                # MUI theme (palette, components overrides, ThemeRegistry)
  types/                # database.ts (Supabase generated) + index.ts (app-level types)
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

Deployed Edge Functions: `send-email`, `job-application`†, `application-withdrawn`, `notifications`, `increase_company_engagement`.

† `job-application` is invoked from three call sites but **its function folder is not in this repo**.
  Add a TODO comment and ensure it is deployed separately.

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
| Hooks | `useDescriptiveName.ts` | `useAsyncData.ts` |
| Services | `<domain>.service.ts` | `jobs.service.ts` |
| Validations | `<domain>.schema.ts` | `job.schema.ts` |
| Client body (split pages) | `<PageName>Client.tsx` | `ProfileClient.tsx` |

---

## State Management

No global Redux/Zustand store. State lives in:
- **React component state** for local UI
- **Supabase session** via `useAuth()` hook for auth state
- **React Query / `useAsyncData`** hook for async server data in client components
- **URL search params** for filter state in public listings

`useAuth()` gives you `user`, `signIn`, `signUp`, `signOut`, etc.
`useSupabase()` gives you a memoized browser Supabase client.

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

## Shared Hooks

| Hook | Location | Purpose |
|---|---|---|
| `useAsyncData` | `hooks/useAsyncData.ts` | Generic loading/error/data/reload wrapper |
| `useNotification` | `hooks/useNotification.ts` | Unified snackbar notify/clear |
| `useAuth` | `hooks/useAuth.ts` | Supabase auth state + actions |
| `useSupabase` | `hooks/useSupabase.ts` | Memoized browser Supabase client |
| `useMessages` | `hooks/useMessages.ts` | Realtime messages subscription |
| `useNotifications` | `hooks/useNotifications.ts` | Realtime notification badge |

---

## Adding a New Feature

1. **Types:** Add/extend columns in `src/types/database.ts` (or run Supabase type gen).
2. **Schema:** Add Zod schema in `src/components/forms/validations/<domain>.schema.ts`.
3. **Service:** Add service functions in `src/services/<domain>.service.ts`. Annotate with RLS comment.
4. **Component:** Create `src/components/<feature>/<Component>.tsx`. Use named export. Add "use client" only if needed.
5. **Form (if needed):** Create `src/components/forms/AddEdit<Domain>.tsx` following the RHF+Zod pattern.
6. **Page:** `src/app/dashboard/<feature>/page.tsx` (server shell with `metadata`) + `*Client.tsx` body.
7. **API route (if needed):** `src/app/api/<resource>/<action>/route.ts`. Use `apiSuccess`/`apiError`.
8. **Tests:** `src/__tests__/<domain>.test.ts` — at minimum a smoke test and key behaviour.

---

## Do Not

These anti-patterns were found and removed during the cleanup pass (2026-04-23):

| Anti-pattern | Correct approach |
|---|---|
| Inline Zod schema inside a component | Move to `validations/<domain>.schema.ts` |
| `React.FC<Props>` type annotation | Use `function Name(props: Props) {}` |
| `createClient()` called in multiple places within same component | Use `useSupabase()` hook once |
| `supabase.from(...)` called directly in a page or component | Call a service function instead |
| `export type { Database, Tables }` re-exported via `@/types` barrel | Import directly from `@/types/database` |
| Deleted service files re-created: `messages.service.ts`, `notifications.service.ts` | `useMessages`/`useNotifications` hooks handle these directly |
| Orphaned components re-created: `ChatWindow`, `CompanyJobList`, `GradientText`, `SkillsDisplay` | These were unused — check before adding similar UI |
| Missing `noValidate` on `<Box component="form">` | Add `noValidate` to every RHF form |
| Framer Motion variants defined inline per-component | Import from `@/lib/motion` |
| Default export from a shared component | Use named exports for all shared components |
| `job-application` Edge Function invoked without deploying it | Ensure the function is deployed; the folder is absent from this repo |
| Manual `useState` validation in forms (`AddEditForm.tsx`) | Migrate to `useForm + zodResolver` (marked TODO) |
