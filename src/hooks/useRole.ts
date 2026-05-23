"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { useSupabase } from "./useSupabase";
import {
  type UserRole,
  isAtLeastEmployer,
  isPremiumOrAdmin,
} from "@/lib/roles";

export type { UserRole };

export interface RoleState {
  role: UserRole;
  loading: boolean;
  /** True if the user has at least one archived application (governs archive nav for 'user'). */
  hasArchivedApplications: boolean;
  isAtLeastEmployer: boolean;
  isPremiumOrAdmin: boolean;
  isAdmin: boolean;
}

export function useRole(): RoleState {
  const { user } = useAuth();
  const supabase = useSupabase();

  const [role, setRole] = useState<UserRole>("user");
  const [fetched, setFetched] = useState(false);
  const [hasArchivedApplications, setHasArchivedApplications] = useState(false);

  useEffect(() => {
    if (!user) return;

    void Promise.all([
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single(),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_archived", true),
    ])
      .then(([profileRes, archivedRes]) => {
        setRole((profileRes.data?.role as UserRole) ?? "user");
        setHasArchivedApplications((archivedRes.count ?? 0) > 0);
      })
      .catch(() => {
        /* keep defaults */
      })
      .finally(() => setFetched(true));
  }, [user, supabase]);

  return {
    role,
    loading: !!user && !fetched,
    hasArchivedApplications,
    isAtLeastEmployer: isAtLeastEmployer(role),
    isPremiumOrAdmin: isPremiumOrAdmin(role),
    isAdmin: role === "admin",
  };
}
