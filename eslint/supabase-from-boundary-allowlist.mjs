/**
 * Paths excluded from `supabase-from-boundary` (no-restricted-syntax for `.from(` calls).
 *
 * Always excluded:
 * - src/services (recursive) — canonical location for Supabase table or storage queries
 * - src/app/api (recursive) — route handlers (prefer calling services; exemption keeps incremental migration)
 * - actions.ts under src/app — Server Actions (same)
 * - src/hooks/useNotifications.ts and useMessages.ts — realtime feed hooks own channel queries
 * - src/__tests__ (recursive) — fixtures or mocks
 *
 * Grandfathered: migrate into services when touching the feature. Keep this list small.
 */
export const supabaseFromBoundaryIgnores = [
  "src/services/**",
  "src/app/api/**",
  "src/app/**/actions.ts",
  "src/hooks/useNotifications.ts",
  "src/hooks/useMessages.ts",
  "src/__tests__/**",

  // Grandfathered — remove when refactored through services
  "src/lib/roles.ts",
  "src/lib/push.ts",
  "src/hooks/useRole.ts",
  "src/app/dashboard/page.tsx",
  "src/app/(public)/users/[[]slug]/page.tsx",
  "src/app/(public)/anunt/AnuntWizard.tsx",
  "src/app/dashboard/profile/NotificationsSettings.tsx",
  "src/app/dashboard/profile/ProfileClient.tsx",
  "src/app/dashboard/jobs/[[]id]/candidates/CandidatesClient.tsx",
  "src/app/dashboard/forms/[[]id]/responses/ResponsesClient.tsx",
  "src/app/dashboard/admin/releases/AdminReleasesClient.tsx",
  "src/app/dashboard/company/CompanyClient.tsx",
  "src/components/forms/ApplicationForm.tsx",
  "src/components/forms/AddEditJob.tsx",
  "src/components/jobs/ApplyButton.tsx",
  "src/components/layout/Navbar.tsx",
];
