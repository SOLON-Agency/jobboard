import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Proxies to Supabase Edge Function `notify-application` from the server.
 * Avoids browser → supabase.co CORS preflight (OPTIONS) which often 404s when
 * the function is missing or the gateway rejects preflight; same-origin fetch from the app has no CORS.
 */
export async function POST(request: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

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

  const edgeUrl = `${url.replace(/\/$/, "")}/functions/v1/notify-application`;

  const edgeRes = await fetch(edgeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
    },
    body: JSON.stringify({
      job_id: body.job_id,
      applicant_user_id: user.id,
    }),
  });

  if (!edgeRes.ok) {
    const text = await edgeRes.text();
    console.warn("notify-application edge:", edgeRes.status, text);
  }

  return NextResponse.json({ ok: true as const });
}
