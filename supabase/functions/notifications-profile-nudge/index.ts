/**
 * notifications-profile-nudge — Supabase Edge Function (daily cron)
 *
 * Runs daily at 08:00 Europe/Bucharest (05:00 UTC).
 * Sends a "complete your profile" nudge to users whose completeness < 90.
 *
 * Authentication: Bearer <CRON_SECRET>
 *
 * Required secrets: CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

function notificationsUrl(): string {
  return `${Deno.env.get("SUPABASE_URL")!}/functions/v1/notifications`;
}
function serviceKey(): string {
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}

async function dispatch(body: Record<string, unknown>): Promise<void> {
  const res = await fetch(notificationsUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`notifications responded ${res.status}: ${text}`);
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) {
    return new Response(JSON.stringify({ error: "CRON_SECRET not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  const authToken = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (authToken !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const siteUrl = (Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "https://legaljobs.ro").replace(/\/$/, "");
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey(), {
    auth: { persistSession: false },
  });

  // Find users with completeness < 90 who have email notifications on
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, completeness")
    .lt("completeness", 90)
    .eq("notifications_email", true);

  const targets = (profiles ?? []) as { id: string; completeness: number }[];
  let sent = 0;
  const errors: string[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const p of targets) {
    try {
      await dispatch({
        type: "profile_nudge",
        recipients: [p.id],
        data: { completeness: p.completeness, site_url: siteUrl },
        idempotency_key: `profile-nudge/${p.id}/${today}`,
      });
      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${p.id}: ${msg}`);
    }
  }

  console.log(`notifications-profile-nudge: sent=${sent} total=${targets.length} errors=${errors.length}`);
  return new Response(
    JSON.stringify({ ok: true, sent, total: targets.length, errors }),
    { headers: { "Content-Type": "application/json" } }
  );
});
