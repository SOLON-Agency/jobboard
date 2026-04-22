# Patterns Quick Reference — /src

Human-facing companion to `src/AGENTS.md`. Use this for copy-paste examples.

---

## Pattern Index

| Pattern | Look at | Copy from |
|---|---|---|
| Data fetching in Server Component | `app/(public)/jobs/[slug]/page.tsx` | `src/services/jobs.service.ts` |
| Data fetching in Client Component | `app/dashboard/applications/ApplicationsClient.tsx` | `src/hooks/useAsyncData.ts` |
| Form with RHF + Zod | `components/auth/LoginForm.tsx` | `components/forms/validations/login.schema.ts` |
| Auth in server component | `app/dashboard/page.tsx` | `lib/supabase/server.ts` |
| Auth in client component | `components/jobs/ApplyButton.tsx` | `hooks/useAuth.ts` |
| Notification/snackbar | `components/jobs/JobDetail.tsx` | `hooks/useNotification.ts` |
| Animation with reduced-motion | `components/jobs/JobsCarousel.tsx` | `lib/motion.ts` |
| API route handler | `app/api/jobs/apply-internal-form/route.ts` | `lib/api.ts` |
| Edge Function invocation | `components/jobs/ApplyButton.tsx` | AGENTS.md "Invoking Edge Functions" |
| TipTap rich text editor | `components/editor/RichTextEditor.tsx` | — |
| Recharts chart | `components/dashboard/DashboardContent.tsx` | — |
| Empty state | `app/dashboard/forms/FormsClient.tsx` | `components/common/EmptyState.tsx` |
| Bordered card | `components/dashboard/DashboardContent.tsx` | `components/common/BorderedCard.tsx` |
| Page with responsive layout | `app/(public)/jobs/page.tsx` | `components/common/PageContainer.tsx` |
| Error boundary | `app/error.tsx` | `app/dashboard/error.tsx` |

---

## Data Fetching

### Server Component (default)

```tsx
// src/app/dashboard/profile/page.tsx
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getMyProfile } from "@/services/profiles.service";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = { title: "Profilul meu", robots: { index: false } };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Pass initial data to client component — avoids a second round-trip
  const profile = await getMyProfile(supabase, user.id);
  return <ProfileClient initialProfile={profile} />;
}
```

### Client Component with `useAsyncData`

```tsx
"use client";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useSupabase } from "@/hooks/useSupabase";
import { useAuth } from "@/hooks/useAuth";
import { getMyProfile } from "@/services/profiles.service";

export function ProfileClient() {
  const supabase = useSupabase();
  const { user } = useAuth();

  const { data: profile, loading, error, reload } = useAsyncData(
    () => getMyProfile(supabase, user!.id),
    [user?.id] // re-fetch when userId changes
  );

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!profile) return null;
  // ...
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

## Notification / Snackbar

```tsx
"use client";
import { useNotification } from "@/hooks/useNotification";
import { Snackbar, Alert } from "@mui/material";

export function MyComponent() {
  const { notification, notify, clearNotification } = useNotification();

  const handleSave = async () => {
    try {
      await saveData();
      notify("Salvat cu succes!", "success");
    } catch {
      notify("A apărut o eroare.", "error");
    }
  };

  return (
    <>
      <Button onClick={handleSave}>Salvează</Button>

      <Snackbar open={!!notification} autoHideDuration={4000} onClose={clearNotification}>
        <Alert severity={notification?.severity ?? "info"} onClose={clearNotification}>
          {notification?.message}
        </Alert>
      </Snackbar>
    </>
  );
}
```

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

```ts
// src/__tests__/widget.test.ts
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddEditWidget } from "@/components/forms/AddEditWidget";

describe("AddEditWidget", () => {
  it("renders without crashing", () => {
    render(<AddEditWidget onSave={vi.fn()} />);
    expect(screen.getByRole("button", { name: /salvează/i })).toBeInTheDocument();
  });

  it("is keyboard navigable", async () => {
    render(<AddEditWidget onSave={vi.fn()} />);
    await userEvent.tab();
    expect(document.activeElement?.tagName).not.toBe("BODY");
  });
});
```
