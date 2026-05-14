"use server";

import { createClient } from "@/lib/supabase/server";
import { claimCompany } from "@/services/companies.service";

export interface ClaimResult {
  ok: true;
  slug: string;
}

export interface ClaimError {
  ok: false;
  error: string;
  /** When set the caller should redirect to this URL (e.g. /register) */
  redirectTo?: string;
}

export async function claimCompanyAction(params: {
  token: string;
  code: string;
  /** Forwarded to the /register redirect so the email field can be pre-filled */
  companyEmail?: string;
}): Promise<ClaimResult | ClaimError> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const claimPath = `/claim?token=${encodeURIComponent(params.token)}`;
    const redirectQuery = params.companyEmail
      ? `${claimPath}&email=${encodeURIComponent(params.companyEmail)}`
      : claimPath;
    return {
      ok: false,
      error: "Trebuie să ai un cont pentru a revendica compania.",
      redirectTo: `/register?redirect=${encodeURIComponent(redirectQuery)}${
        params.companyEmail ? `&email=${encodeURIComponent(params.companyEmail)}` : ""
      }`,
    };
  }

  if (!params.token || !params.code) {
    return { ok: false, error: "Token sau cod lipsă." };
  }

  try {
    const { slug } = await claimCompany(supabase, {
      token: params.token,
      code: params.code,
    });
    return { ok: true, slug };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : JSON.stringify(err);
    return { ok: false, error: message };
  }
}
