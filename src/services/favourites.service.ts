import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";

export type FavouriteJob = Tables<"job_listings"> & {
  companies: Tables<"companies"> | null;
};
export type FavouriteCompany = Tables<"companies">;

// ── Job favourites ─────────────────────────────────────────────────────────────

export const toggleJobFavourite = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  jobId: string
): Promise<boolean> => {
  const { data: existing } = await supabase
    .from("favorites")
    .select("job_id")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("job_id", jobId);
    return false;
  }

  await supabase.from("favorites").insert({ user_id: userId, job_id: jobId });
  return true;
};

export const getUserJobFavourites = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Set<string>> => {
  const { data, error } = await supabase
    .from("favorites")
    .select("job_id")
    .eq("user_id", userId);

  if (error) throw error;
  return new Set(data?.map((f) => f.job_id) ?? []);
};

export const getFavouriteJobs = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<FavouriteJob[]> => {
  const { data, error } = await supabase
    .from("favorites")
    .select("created_at, job_listings!inner(*, companies(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map(
    (row) => (row as unknown as { job_listings: FavouriteJob }).job_listings
  );
};

// ── Company favourites ─────────────────────────────────────────────────────────

export const toggleCompanyFavourite = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  companyId: string
): Promise<boolean> => {
  const { data: existing } = await supabase
    .from("company_favourites")
    .select("company_id")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("company_favourites")
      .delete()
      .eq("user_id", userId)
      .eq("company_id", companyId);
    return false;
  }

  await supabase
    .from("company_favourites")
    .insert({ user_id: userId, company_id: companyId });

  // Notify company admins that a user has favourited their company
  void (async () => {
    try {
      const { data: company } = await supabase
        .from("companies")
        .select("name, slug")
        .eq("id", companyId)
        .maybeSingle();
      const { data: companyUsers } = await supabase
        .from("company_users")
        .select("user_id")
        .eq("company_id", companyId)
        .not("accepted_at", "is", null);
      const adminIds = (companyUsers ?? []).map((cu: { user_id: string }) => cu.user_id);
      if (adminIds.length > 0 && company) {
        await dispatchNotification(supabase, {
          type: NOTIFICATION_TYPES.COMPANY_FAVORITED,
          recipients: adminIds,
          data: {
            company_name: (company as { name: string; slug: string | null }).name,
            company_id: companyId,
          },
          idempotencyKey: `company-favorited/${companyId}/${userId}`,
        });
      }
    } catch (e) {
      console.warn("toggleCompanyFavourite: notify failed:", e);
    }
  })();

  return true;
};

export const getUserCompanyFavourites = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Set<string>> => {
  const { data, error } = await supabase
    .from("company_favourites")
    .select("company_id")
    .eq("user_id", userId);

  if (error) throw error;
  return new Set(data?.map((f) => f.company_id) ?? []);
};

export const getFavouriteCompanies = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<FavouriteCompany[]> => {
  const { data, error } = await supabase
    .from("company_favourites")
    .select("created_at, companies!inner(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map(
    (row) => (row as unknown as { companies: FavouriteCompany }).companies
  );
};
