import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendCompanyCreatedEmail } from "@/lib/email/send-company-created-notification";

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { company_id?: string };
  try {
    body = (await request.json()) as { company_id?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.company_id || typeof body.company_id !== "string") {
    return NextResponse.json({ error: "company_id required" }, { status: 400 });
  }

  try {
    await sendCompanyCreatedEmail(supabase, user, body.company_id, siteUrl());
  } catch (err) {
    console.warn("notify-created:", err);
  }

  return NextResponse.json({ ok: true as const });
}
