"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { assertFeatureEnabled } from "@/lib/feature-flags";

const inputSchema = z.object({
  email: z.string().email().max(254),
  source: z.string().max(40).optional(),
});

export type SubscribeResult =
  | { status: "subscribed" }
  | { status: "already" }
  | { status: "error"; message: string };

/**
 * Subscribes an email to the newsletter.
 * Idempotent — duplicate emails return `already` without leaking whether they existed.
 * RLS: anon INSERT is permitted on newsletter_subscribers.
 */
export async function subscribeToNewsletter(
  input: z.infer<typeof inputSchema>
): Promise<SubscribeResult> {
  assertFeatureEnabled("blog");

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Adresă de email invalidă" };
  }

  const { email, source } = parsed.data;
  const supabase = await createClient();

  // Plain INSERT — upsert requires UPDATE permission which is admin-only.
  // Unique constraint violations (duplicate email) are silently treated as
  // success to avoid leaking whether an address is already subscribed.
  const { error } = await supabase.from("newsletter_subscribers").insert({
    email: email.toLowerCase().trim(),
    source: source ?? "homepage",
    is_active: true,
  });

  if (error) {
    // 23505 = unique_violation — email already exists, treat as success
    if (error.code === "23505") return { status: "subscribed" };
    console.error("newsletter subscribe error:", error.message);
    return { status: "error", message: "A apărut o eroare. Încearcă din nou." };
  }

  return { status: "subscribed" };
}
