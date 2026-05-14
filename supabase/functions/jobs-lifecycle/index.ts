/**
 * jobs-lifecycle — Supabase Edge Function (daily cron)
 *
 * Processes two automated lifecycle transitions:
 *   1. PUBLISH  — drafts with published_at ≤ NOW() → status = 'published'
 *   2. EXPIRE   — published jobs with expires_at ≤ NOW() → status = 'archived'
 *
 * Notifications sent via v2 dispatcher (typed mode).
 *
 * Authentication: Bearer <CRON_SECRET>
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

interface JobRow { id: string; title: string; slug: string; }
interface PosterRow { poster_user_id: string | null; poster_email: string | null; poster_name: string | null; }
interface LifecycleResult { published: number; expired: number; errors: string[]; }

function notificationsUrl(): string { return `${Deno.env.get("SUPABASE_URL")!}/functions/v1/notifications`; }
function serviceRoleKey(): string { return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; }

async function notifyPoster(
  posterUserId: string,
  type: string,
  jobTitle: string,
  jobUrl: string,
  siteUrl: string,
  idempotencyKey: string
): Promise<void> {
  const res = await fetch(notificationsUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type,
      recipients: [posterUserId],
      data: { job_title: jobTitle, job_url: jobUrl, site_url: siteUrl },
      idempotency_key: idempotencyKey,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`notifications responded ${res.status}: ${text}`);
  }
}

// deno-lint-ignore no-explicit-any
async function resolvePoster(adminClient: any, jobId: string): Promise<PosterRow | null> {
  const { data, error } = await adminClient.rpc("job_poster_recipient", { p_job_id: jobId });
  if (error) { console.warn(`jobs-lifecycle: job_poster_recipient(${jobId}):`, error.message); return null; }
  if (!data || data.length === 0) return null;
  return data[0] as PosterRow;
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

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token || token !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceRoleKey(),
    { auth: { persistSession: false } }
  );

  const siteUrl = (Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "https://legaljobs.ro").replace(/\/$/, "");
  const now = new Date().toISOString();
  const result: LifecycleResult = { published: 0, expired: 0, errors: [] };

  // ── 1. PUBLISH due drafts ─────────────────────────────────────────────────
  try {
    const { data: dueDrafts, error: selectErr } = await adminClient
      .from("job_listings")
      .select("id, title, slug")
      .eq("status", "draft")
      .eq("is_archived", false)
      .lte("published_at", now)
      .not("published_at", "is", null);

    if (selectErr) throw selectErr;
    const jobs = (dueDrafts ?? []) as JobRow[];

    if (jobs.length > 0) {
      const ids = jobs.map((j) => j.id);
      const { error: updateErr } = await adminClient
        .from("job_listings")
        .update({ status: "published" })
        .in("id", ids);

      if (updateErr) throw updateErr;

      result.published = jobs.length;
      console.log(`jobs-lifecycle: published ${jobs.length} job(s)`);

      for (const job of jobs) {
        try {
          const poster = await resolvePoster(adminClient, job.id);
          if (!poster?.poster_user_id) continue;
          await notifyPoster(
            poster.poster_user_id,
            "job_published",
            job.title,
            `${siteUrl}/jobs/${job.slug}`,
            siteUrl,
            `job-published-${job.id}`
          );
        } catch (notifyErr) {
          console.warn(`jobs-lifecycle: notify failed for job ${job.id}:`, notifyErr);
          result.errors.push(`publish-notify:${job.id}: ${String(notifyErr)}`);
        }
      }
    }
  } catch (err) {
    console.error("jobs-lifecycle: publish step error:", err);
    result.errors.push(`publish-step: ${String(err)}`);
  }

  // ── 2. EXPIRE overdue published jobs ─────────────────────────────────────
  try {
    const { data: expiredJobs, error: selectErr } = await adminClient
      .from("job_listings")
      .select("id, title, slug")
      .eq("status", "published")
      .eq("is_archived", false)
      .lte("expires_at", now)
      .not("expires_at", "is", null);

    if (selectErr) throw selectErr;
    const jobs = (expiredJobs ?? []) as JobRow[];

    if (jobs.length > 0) {
      const ids = jobs.map((j) => j.id);
      const { error: updateErr } = await adminClient
        .from("job_listings")
        .update({ status: "archived", is_archived: true, archived_at: now })
        .in("id", ids);

      if (updateErr) throw updateErr;

      result.expired = jobs.length;
      console.log(`jobs-lifecycle: expired ${jobs.length} job(s)`);

      for (const job of jobs) {
        try {
          const poster = await resolvePoster(adminClient, job.id);
          if (!poster?.poster_user_id) continue;
          await notifyPoster(
            poster.poster_user_id,
            "job_unpublished",
            job.title,
            `${siteUrl}/dashboard/jobs`,
            siteUrl,
            `job-expired-${job.id}`
          );
        } catch (notifyErr) {
          console.warn(`jobs-lifecycle: notify failed for job ${job.id}:`, notifyErr);
          result.errors.push(`expire-notify:${job.id}: ${String(notifyErr)}`);
        }
      }
    }
  } catch (err) {
    console.error("jobs-lifecycle: expire step error:", err);
    result.errors.push(`expire-step: ${String(err)}`);
  }

  const status = result.errors.length > 0 ? 207 : 200;
  return new Response(JSON.stringify(result), {
    status,
    headers: { "Content-Type": "application/json" },
  });
});
