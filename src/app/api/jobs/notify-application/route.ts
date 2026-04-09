import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendApplicationNotificationEmails } from "@/lib/email/send-application-notification";

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

/**
 * Sends application notification emails from the Next.js server using the user’s
 * Supabase session (RLS + SECURITY DEFINER RPC). Resend keys live only here — no
 * service-role key in the app.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { job_id?: string };
  try {
    body = (await request.json()) as { job_id?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.job_id || typeof body.job_id !== "string") {
    return NextResponse.json({ error: "job_id required" }, { status: 400 });
  }

  try {
    await sendApplicationNotificationEmails(
      supabase,
      user,
      body.job_id,
      siteUrl()
    );
  } catch (err) {
    console.warn("notify-application:", err);
  }

  return NextResponse.json({ ok: true as const });
}
