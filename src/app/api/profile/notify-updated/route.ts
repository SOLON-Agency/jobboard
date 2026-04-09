import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendProfileUpdatedEmail } from "@/lib/email/send-profile-updated-notification";

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await sendProfileUpdatedEmail(supabase, user, siteUrl());
  } catch (err) {
    console.warn("notify-updated:", err);
  }

  return NextResponse.json({ ok: true as const });
}
