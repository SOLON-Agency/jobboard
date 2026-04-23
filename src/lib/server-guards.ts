/**
 * Server-side role guards for Next.js App Router pages and layouts.
 * Call these at the top of any server component that requires a minimum role.
 * They read the user's role from their profile (via the server Supabase client)
 * and redirect to /dashboard if the role requirement is not met.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getServerRole, isAtLeastEmployer } from "@/lib/roles";

/** Redirect to /dashboard unless the user is employer, premium_employer, or admin. */
export async function requireEmployerRole(): Promise<void> {
  const supabase = await createClient();
  const role = await getServerRole(supabase);
  if (!isAtLeastEmployer(role)) redirect("/dashboard");
}

/** Redirect to /dashboard unless the user is admin. */
export async function requireAdminRole(): Promise<void> {
  const supabase = await createClient();
  const role = await getServerRole(supabase);
  if (role !== "admin") redirect("/dashboard");
}
