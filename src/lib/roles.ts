import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type UserRole = Database["public"]["Enums"]["user_role"];

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "Utilizator",
  employer: "Angajator",
  premium_employer: "Angajator Premium",
  admin: "Administrator",
};

export const ROLE_ORDER: UserRole[] = [
  "user",
  "employer",
  "premium_employer",
  "admin",
];

/** Max active (published, non-archived) job listings per role. null = unlimited. */
export const MAX_ACTIVE_JOBS: Record<UserRole, number | null> = {
  user: 0,
  employer: 3,
  premium_employer: null,
  admin: null,
};

/** Max active (non-archived) companies per role. null = unlimited. */
export const MAX_ACTIVE_COMPANIES: Record<UserRole, number | null> = {
  user: 0,
  employer: 1,
  premium_employer: null,
  admin: null,
};

export function isAtLeastEmployer(role: UserRole): boolean {
  return role === "employer" || role === "premium_employer" || role === "admin";
}

export function isPremiumOrAdmin(role: UserRole): boolean {
  return role === "premium_employer" || role === "admin";
}

/** Server-side: read the authenticated user's role from their profile row. */
export async function getServerRole(
  supabase: SupabaseClient<Database>
): Promise<UserRole> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "user";
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return (data?.role as UserRole) ?? "user";
}
