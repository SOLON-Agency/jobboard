import { NextResponse } from "next/server";

/**
 * Deprecated — email sending has moved to the Supabase Edge Function `send-email`.
 * Callers should use `supabase.functions.invoke("send-email", { body: { event: "company_created", company_id } })`.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Gone — use the send-email Edge Function instead." },
    { status: 410 }
  );
}
