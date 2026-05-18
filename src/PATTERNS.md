# Patterns Quick Reference — /src

Human-facing companion to **`src/AGENTS.md`**. Copy-paste snippets must stay aligned with **`/AGENTS.md`** (product rules, notifications, secrets).

**Documentation map:** `/AGENTS.md` (product + ops) · `/README.md` (onboarding) · **`src/AGENTS.md`** (conventions) · **`src/PATTERNS.md`** (this file).

---

## Pattern Index

Reference implementations — when introducing a new feature, prefer mirroring an existing row before inventing a new pattern.

| Pattern | Reference implementation | Primary utilities |
|---|---|---|
| Data fetching in Server Component | `app/(public)/jobs/[slug]/page.tsx` | `createClient` / `createStaticClient`, `src/services/*.service.ts` |
| Data fetching in Client Component (RTK Query + cache) | `app/dashboard/jobs/JobsClient.tsx` | `src/store/jobBoardApi.ts`, **`jobBoardApi.util.invalidateTags`** after mutations |
| Data fetching in Client Component (legacy `useEffect`) | _(remaining dashboard screens)_ | Migrate toward **`jobBoardApi`** endpoints |
| Data fetching in Client Component (`useAsyncData` wrapper) | _(optional thin helper)_ | `src/hooks/useAsyncData.ts` — small screens without RTK yet |
| Form with RHF + Zod | `components/auth/LoginForm.tsx` | `components/forms/validations/*.schema.ts` |
| Postgres-aligned Zod (generated, optional compose with forms) | — | `types/database.zod.ts` via **`npm run codegen`** · **`src/AGENTS.md`** *DB-aligned Zod* |
| Auth in server component | `app/dashboard/page.tsx` | `lib/supabase/server.ts`, `getUser()` |
| Auth in client component | `components/jobs/ApplyButton.tsx` | `hooks/useAuth.ts` |
| Ephemeral toast / snackbar | `app/dashboard/jobs/JobsClient.tsx` | `contexts/ToastContext.tsx` → **`useToast`** |
| Persisted in-app notification feed | `components/notifications/NotificationBell.tsx` | `hooks/useNotifications.ts` |
| Animation with reduced-motion | `components/jobs/JobsCarousel.tsx` | `lib/motion.ts` |
| API route handler | `app/api/jobs/apply-internal-form/route.ts` | `lib/api.ts` |
| Typed notification dispatch | `lib/notifications/dispatch.ts` | `supabase.functions.invoke("notifications", …)` |
| Edge Function invocation (direct) | `components/jobs/ApplyButton.tsx`, `app/api/jobs/apply-internal-form/route.ts` | `/AGENTS.md` → *Invoking Edge Functions* |
| TipTap rich text | `components/editor/RichTextEditor.tsx` | — |
| Recharts chart | `components/dashboard/DashboardContent.tsx` | — |
| Empty state | `app/dashboard/forms/FormsClient.tsx` | `components/common/EmptyState.tsx` |
| Bordered card | `components/dashboard/DashboardContent.tsx` | `components/common/BorderedCard.tsx` |
| Page layout container | `app/(public)/jobs/page.tsx` | `components/common/PageContainer.tsx` |
| Error boundary | `app/error.tsx` | `app/dashboard/error.tsx` |
| Feature flag (static, JSON) | `lib/feature-flags.ts`, `middleware.ts` | `config/app.settings.json` |
| Feature flag (Vercel Flags / Toolbar) | `flags.ts`, `components/providers/FavouritesFeatureRoot.tsx` | `flags/next`, `@flags-sdk/vercel` |

---

## Data Fetching

### Server Component (default)

Prefer fetching on the server when data can be resolved without browser-only APIs. Use **`src/services/*`** (not ad-hoc `.from()` scattered across pages — legacy pages may still violate this; consolidate when editing).

```tsx
// Pattern from src/app/(public)/jobs/[slug]/page.tsx — metadata + body load
import { createClient } from "@/lib/supabase/server";
import { getJobBySlug } from "@/services/jobs.service";
import { notFound } from "next/navigation";

export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  let job;
  try {
    job = await getJobBySlug(supabase, slug);
  } catch {
    notFound();
  }
  return <JobDetailWrapper job={job} />;
}
```

Pass **serializable** props into client components. For authenticated dashboard shells that still render a client-only body without server prefetch, see `src/app/dashboard/profile/page.tsx` → **`ProfileClient`** (loads in `useEffect` today).

### Client Component — dominant legacy pattern

Most dashboard `*Client.tsx` files today use **`useCallback` + `useEffect`** and manage **`loading` / `data`** with **`useState`**. Example shape (simplified from **`JobsClient`**):

```tsx
"use client";
import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/hooks/useSupabase";
import { useAuth } from "@/hooks/useAuth";

export function JobsClient() {
  const { user } = useAuth();
  const supabase = useSupabase();
  const [rows, setRows] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("job_listings").select("*").limit(20);
    setRows(data ?? []);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return null;
  return /* … */;
}
```

**Target state:** move `.from()` chains into **`src/services/*.service.ts`** and call those functions from the effect (see **`src/AGENTS.md`**). Optionally wrap the effect body with **`useAsyncData`** below.

### Client Component — preferred `useAsyncData` wrapper

Use when the whole screen depends on one async result (or compose multiple calls inside the fetcher). **`src/hooks/useAsyncData.ts`** is the shared helper (not React Query — not installed).

```tsx
"use client";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useSupabase } from "@/hooks/useSupabase";
import { useAuth } from "@/hooks/useAuth";
import { getMyProfile } from "@/services/profiles.service";
import { Alert, CircularProgress } from "@mui/material";

export function ProfileExampleClient() {
  const supabase = useSupabase();
  const { user } = useAuth();

  const { data: profile, loading, error, reload } = useAsyncData(
    async () => {
      if (!user) throw new Error("Neautentificat");
      return getMyProfile(supabase, user.id);
    },
    [user?.id, supabase]
  );

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!profile) return null;
  return null; /* … */
}
```

---

## Auth

### Server context

```tsx
// Always use getUser() — not getSession() — for security in server context:
const { data: { user }, error } = await supabase.auth.getUser();
if (!user) redirect("/login");
```

### Client context

```tsx
const { user, loading, signIn, signOut } = useAuth();
if (loading) return <Skeleton />;
if (!user) return <LoginPrompt />;
```

---

## Full Form Example

```tsx
// src/components/forms/validations/widget.schema.ts
import { z } from "zod";

export const widgetSchema = z.object({
  name: z.string().min(2, "Minim 2 caractere"),
  count: z.number().int().min(0),
});
export type WidgetFormData = z.infer<typeof widgetSchema>;

// src/components/forms/AddEditWidget.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { widgetSchema, type WidgetFormData } from "@/components/forms/validations/widget.schema";

interface AddEditWidgetProps {
  initial?: WidgetFormData;
  onSave: (data: WidgetFormData) => Promise<void>;
}

export function AddEditWidget({ initial, onSave }: AddEditWidgetProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WidgetFormData>({
    resolver: zodResolver(widgetSchema),
    defaultValues: initial,
  });

  return (
    <Box component="form" onSubmit={handleSubmit(onSave)} noValidate>
      <TextField
        {...register("name")}
        label="Nume"
        error={!!errors.name}
        helperText={errors.name?.message}
        inputProps={{ "aria-describedby": "name-error" }}
      />
      <Button type="submit" variant="contained" disabled={isSubmitting}>
        {isSubmitting ? "Se salvează..." : "Salvează"}
      </Button>
    </Box>
  );
}
```

---

## Ephemeral feedback — `useToast` (not local Snackbar)

There are **two** notification mechanisms — **`useToast`** for transient UI, **`useNotifications`** for the persisted DB bell feed. See **`/AGENTS.md`** → *UI notification patterns*. The old **`useNotification`** hook (singular) was removed.

```tsx
"use client";
import { useToast } from "@/contexts/ToastContext";

export function MyComponent() {
  const { showToast } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      showToast("Salvat cu succes.");
      showToast("Anunț arhivat.", "info");
    } catch {
      showToast("A apărut o eroare.", "error", 5000);
    }
  };

  return <button type="button" onClick={handleSave}>Salvează</button>;
}
```

**Exceptions:** **`EditSideDrawer`** accepts a **`message`** prop for errors that must stay visible until the drawer closes (persistent in-drawer feedback).

---

## TipTap Rich Text Editor

```tsx
import { RichTextEditor } from "@/components/editor/RichTextEditor";

<RichTextEditor
  value={content}
  onChange={(html) => setContent(html)}
  placeholder="Descriere..."
  minHeight={200}
/>
```

---

## Recharts Chart

```tsx
// See DashboardContent.tsx for a full working example with ResponsiveContainer,
// AreaChart / BarChart, XAxis, YAxis, Tooltip, and custom tooltips.
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

<ResponsiveContainer width="100%" height={180}>
  <AreaChart data={chartData}>
    <Area dataKey="count" />
    <XAxis dataKey="month" />
    <YAxis />
    <Tooltip />
  </AreaChart>
</ResponsiveContainer>
```

---

## Email (Resend via Edge Function)

```ts
// Trigger a transactional email for the logged-in user:
void supabase.functions
  .invoke("send-email", { body: { event: "profile_updated" } })
  .catch((err: unknown) => console.warn("send-email:", err));

// Company created:
void supabase.functions
  .invoke("send-email", { body: { event: "company_created", company_id: company.id } })
  .catch(console.warn);
```

Full payload docs in `/AGENTS.md` under "Transactional email".

---

## Error Boundary

Each route segment has `loading.tsx` and `error.tsx`:

```
src/app/
  loading.tsx          ← root fallback
  error.tsx            ← root error boundary
  dashboard/
    loading.tsx        ← dashboard fallback
    error.tsx          ← dashboard error boundary
  (public)/jobs/
    loading.tsx
    error.tsx
```

`error.tsx` must be a `"use client"` file and export a default function with
`({ error, reset }: { error: Error; reset: () => void })` signature.

---

## Vitest Test Template

Uses packages already in **`package.json`** (`vitest`, `@testing-library/react`, `@testing-library/jest-dom`). Add **`@testing-library/user-event`** only if you need richer interaction simulation.

```ts
// src/__tests__/widget.test.ts
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LoginForm } from "@/components/auth/LoginForm";

describe("LoginForm", () => {
  it("renders email field", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
  });

  it("submit button is keyboard reachable", () => {
    render(<LoginForm />);
    const btn = screen.getByRole("button", { name: /conectare/i });
    btn.focus();
    expect(document.activeElement).toBe(btn);
    fireEvent.click(btn);
  });
});
```
