import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { JobSearchFilters } from "@/types";

export type AlertFilters = Pick<
  JobSearchFilters,
  "q" | "location" | "type" | "experience" | "salaryMin" | "salaryMax" | "remote" | "minBenefits"
>;

/** Serialise a `JobSearchFilters`-compatible object to a plain `Record<string,string>` for DB storage. */
export const serializeFilters = (filters: AlertFilters): Record<string, string> => {
  const out: Record<string, string> = {};
  if (filters.q)           out.q           = filters.q;
  if (filters.location)    out.location    = filters.location;
  if (filters.type)        out.type        = filters.type;
  if (filters.experience)  out.experience  = filters.experience;
  if (filters.salaryMin != null) out.salaryMin = String(filters.salaryMin);
  if (filters.salaryMax != null) out.salaryMax = String(filters.salaryMax);
  if (filters.remote != null)    out.remote    = String(filters.remote);
  if (filters.minBenefits != null && filters.minBenefits > 0)
    out.minBenefits = String(filters.minBenefits);
  return out;
};

/** Parse a DB `Json` blob back into `AlertFilters`. */
export const parseFilters = (raw: Json): AlertFilters => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const r = raw as Record<string, Json>;
  const filters: AlertFilters = {};
  if (typeof r.q        === "string" && r.q)        filters.q        = r.q;
  if (typeof r.location === "string" && r.location) filters.location = r.location;
  if (typeof r.type     === "string" && r.type)     filters.type     = r.type as AlertFilters["type"];
  if (typeof r.experience === "string" && r.experience)
    filters.experience = r.experience as AlertFilters["experience"];
  if (typeof r.salaryMin === "string" && r.salaryMin)
    filters.salaryMin = Number(r.salaryMin);
  if (typeof r.salaryMax === "string" && r.salaryMax)
    filters.salaryMax = Number(r.salaryMax);
  if (typeof r.remote === "string" && r.remote)
    filters.remote = r.remote === "true";
  if (typeof r.minBenefits === "string" && r.minBenefits)
    filters.minBenefits = Number(r.minBenefits);
  return filters;
};

/** Fetch the authenticated user's own alerts, optionally filtered by archived status. */
export const getUserAlerts = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  { archived = false }: { archived?: boolean } = {}
) => {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_archived", archived)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

/** Admin-only: fetch all non-archived alerts and enrich with owner profile info. */
export const getAllAlerts = async (supabase: SupabaseClient<Database>) => {
  const { data: alerts, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!alerts || alerts.length === 0) return [];

  // Fetch owner profiles in a single IN query (separate because alerts.user_id
  // references auth.users, not public.profiles, so PostgREST cannot auto-join).
  const userIds = [...new Set(alerts.map((a) => a.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, slug")
    .in("id", userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return alerts.map((alert) => ({
    ...alert,
    profiles: profileMap.get(alert.user_id) ?? null,
  }));
};

export const createAlert = async (
  supabase: SupabaseClient<Database>,
  alert: Database["public"]["Tables"]["alerts"]["Insert"]
) => {
  const { data, error } = await supabase
    .from("alerts")
    .insert(alert)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateAlert = async (
  supabase: SupabaseClient<Database>,
  id: string,
  updates: Database["public"]["Tables"]["alerts"]["Update"]
) => {
  const { data, error } = await supabase
    .from("alerts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/** Toggle archive state on an alert. */
export const archiveAlert = async (
  supabase: SupabaseClient<Database>,
  id: string,
  archive: boolean
) => {
  return updateAlert(supabase, id, {
    is_archived: archive,
    archived_at: archive ? new Date().toISOString() : null,
  });
};

/** Hard-delete — not exposed in the UI; kept for admin / cleanup use. */
export const deleteAlert = async (supabase: SupabaseClient<Database>, id: string) => {
  const { error } = await supabase.from("alerts").delete().eq("id", id);
  if (error) throw error;
};
