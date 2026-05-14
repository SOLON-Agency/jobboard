/**
 * notifications-job-expiry-tomorrow — Supabase Edge Function (daily cron)
 *
 * Runs daily at 09:00 Europe/Bucharest (06:00 UTC).
 * Finds published jobs expiring tomorrow and notifies:
 *   - the job creator (poster)
 *   - users who have saved the job (job followers / favourites)
 *   - candidates who applied and whose application is not withdrawn/rejected
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

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(23, 59, 59, 999);

  // Find jobs expiring tomorrow
  const { data: expiringJobs } = await admin
    .from("job_listings")
    .select("id, title, slug, company_id, companies(name)")
    .eq("status", "published")
    .eq("is_archived", false)
    .gte("expires_at", tomorrow.toISOString())
    .lte("expires_at", tomorrowEnd.toISOString());

  const jobs = (expiringJobs ?? []) as {
    id: string;
    title: string;
    slug: string;
    company_id: string;
    // deno-lint-ignore no-explicit-any
    companies: any;
  }[];

  let totalSent = 0;
  const errors: string[] = [];

  for (const job of jobs) {
    const companyName = job.companies?.name ?? "";
    const jobUrl = `${siteUrl}/jobs/${job.slug}`;
    const jobData = {
      job_title: job.title,
      company_name: companyName,
      job_url: jobUrl,
      site_url: siteUrl,
    };
    const iKey = `job-expiry-tomorrow/${job.id}/${tomorrow.toISOString().slice(0, 10)}`;

    try {
      // Notify poster
      const { data: posterRows } = await admin.rpc("job_poster_recipient", { p_job_id: job.id });
      // deno-lint-ignore no-explicit-any
      const poster = (posterRows as any[])?.[0] as { poster_user_id?: string | null } | undefined;
      if (poster?.poster_user_id) {
        await dispatch({
          type: "job_expires_tomorrow",
          recipients: [poster.poster_user_id],
          data: jobData,
          idempotency_key: `${iKey}/poster`,
        });
        totalSent++;
      }

      // Notify favouriters (job followers)
      const { data: favs } = await admin
        .from("favorites")
        .select("user_id")
        .eq("job_id", job.id);

      const favUserIds = (favs ?? []).map((f: { user_id: string }) => f.user_id);
      if (favUserIds.length > 0) {
        await dispatch({
          type: "job_expires_tomorrow",
          recipients: favUserIds,
          data: jobData,
          idempotency_key: `${iKey}/followers`,
        });
        totalSent += favUserIds.length;
      }

      // Notify active candidates
      const { data: apps } = await admin
        .from("applications")
        .select("user_id")
        .eq("job_id", job.id)
        .not("status", "in", '("withdrawn","rejected")');

      const candidateIds = [...new Set((apps ?? []).map((a: { user_id: string }) => a.user_id))];
      if (candidateIds.length > 0) {
        await dispatch({
          type: "job_expires_tomorrow",
          recipients: candidateIds,
          data: jobData,
          idempotency_key: `${iKey}/candidates`,
        });
        totalSent += candidateIds.length;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`job ${job.id}: ${msg}`);
    }
  }

  console.log(`notifications-job-expiry-tomorrow: jobs=${jobs.length} sent=${totalSent} errors=${errors.length}`);
  return new Response(
    JSON.stringify({ ok: true, jobs: jobs.length, sent: totalSent, errors }),
    { headers: { "Content-Type": "application/json" } }
  );
});
