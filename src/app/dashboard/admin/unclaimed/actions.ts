"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminRole } from "@/lib/server-guards";

export async function deleteUnclaimedCompanyAction(companyId: string): Promise<{ error?: string }> {
  try {
    await requireAdminRole();
  } catch {
    return { error: "Acces restricționat: rol de administrator necesar." };
  }

  const supabase = await createClient();

  // Delete job listings first (they may not have ON DELETE CASCADE in RLS policies).
  const { error: jobsError } = await supabase
    .from("job_listings")
    .delete()
    .eq("company_id", companyId);

  if (jobsError) return { error: jobsError.message };

  // Delete company_users rows for this company.
  const { error: cuError } = await supabase
    .from("company_users")
    .delete()
    .eq("company_id", companyId);

  if (cuError) return { error: cuError.message };

  // Delete the company itself (company_claim_tokens + nudge_log cascade via FK).
  const { error: companyError } = await supabase
    .from("companies")
    .delete()
    .eq("id", companyId)
    .eq("is_claimed", false); // safety guard: never delete a claimed company

  if (companyError) return { error: companyError.message };

  revalidatePath("/dashboard/admin/unclaimed");
  return {};
}
