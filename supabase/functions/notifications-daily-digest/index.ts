/**
 * notifications-daily-digest — Supabase Edge Function (daily cron)
 *
 * Runs daily at 08:00 Europe/Bucharest (05:00 UTC).
 * Sends each user a digest of yesterday's platform activity plus their own activity.
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

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const yesterdayEnd = new Date(yesterday);
  yesterdayEnd.setHours(23, 59, 59, 999);

  const yesterdayIso = yesterday.toISOString();
  const yesterdayEndIso = yesterdayEnd.toISOString();

  // ── Global stats (yesterday) ─────────────────────────────────────────────
  const [{ count: newJobs }, { count: newCompanies }, { count: newCandidates }] =
    await Promise.all([
      admin.from("job_listings").select("id", { count: "exact", head: true })
        .gte("created_at", yesterdayIso).lte("created_at", yesterdayEndIso),
      admin.from("companies").select("id", { count: "exact", head: true })
        .gte("created_at", yesterdayIso).lte("created_at", yesterdayEndIso),
      admin.from("profiles").select("id", { count: "exact", head: true })
        .gte("created_at", yesterdayIso).lte("created_at", yesterdayEndIso),
    ]);

  // ── All users opted in to daily_digest (email channel on, pref not explicitly off) ──
  const { data: users } = await admin
    .from("profiles")
    .select("id, role")
    .eq("notifications_email", true);

  const allUsers = (users ?? []) as { id: string; role: string }[];

  let sent = 0;
  const errors: string[] = [];

  for (const u of allUsers) {
    try {
      const isEmployer = ["employer", "premium_employer", "admin"].includes(u.role);

      const myData: Record<string, number | null> = {};

      if (isEmployer) {
        // My companies
        const { data: myCompanies } = await admin
          .from("company_users")
          .select("company_id")
          .eq("user_id", u.id);

        const companyIds = (myCompanies ?? []).map((c: { company_id: string }) => c.company_id);

        if (companyIds.length > 0) {
          const [{ count: myJobs }, { count: myCandidates }] = await Promise.all([
            admin.from("job_listings").select("id", { count: "exact", head: true })
              .in("company_id", companyIds)
              .gte("created_at", yesterdayIso).lte("created_at", yesterdayEndIso),
            admin.from("applications").select("id", { count: "exact", head: true })
              .in("job_id",
                (await admin.from("job_listings").select("id").in("company_id", companyIds))
                  .data?.map((j: { id: string }) => j.id) ?? []
              )
              .gte("applied_at", yesterdayIso).lte("applied_at", yesterdayEndIso),
          ]);
          myData.my_jobs = myJobs ?? 0;
          myData.my_new_candidates = myCandidates ?? 0;
        }
      } else {
        // Candidate: their applications
        const { count: myApps } = await admin
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", u.id)
          .gte("applied_at", yesterdayIso).lte("applied_at", yesterdayEndIso);
        myData.my_applications = myApps ?? 0;
      }

      await dispatch({
        type: "daily_digest",
        recipients: [u.id],
        data: {
          new_jobs: newJobs ?? 0,
          new_companies: newCompanies ?? 0,
          new_candidates: newCandidates ?? 0,
          site_url: siteUrl,
          ...myData,
        },
        idempotency_key: `daily-digest/${u.id}/${yesterday.toISOString().slice(0, 10)}`,
      });
      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${u.id}: ${msg}`);
      console.warn("notifications-daily-digest: error for user", u.id, msg);
    }
  }

  console.log(`notifications-daily-digest: sent=${sent} errors=${errors.length}`);
  return new Response(
    JSON.stringify({ ok: true, sent, total: allUsers.length, errors }),
    { headers: { "Content-Type": "application/json" } }
  );
});
