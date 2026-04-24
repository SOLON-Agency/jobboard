/**
 * jobs-lifecycle — Supabase Edge Function (daily cron)
 *
 * Processes two automated lifecycle transitions for job listings:
 *
 *   1. PUBLISH  — drafts whose `published_at` is on or before NOW() are
 *                 flipped to `status = 'published'` and the creator is notified.
 *
 *   2. EXPIRE   — published jobs whose `expires_at` is on or before NOW() are
 *                 flipped to `status = 'archived'`, `is_archived = true`, and
 *                 the creator is notified.
 *
 * Authentication: Bearer <CRON_SECRET> (not a user JWT — this is an internal
 * server-to-server call from a scheduler, matching the scrape-jobs pattern).
 *
 * Required Supabase secrets:
 *   CRON_SECRET            — shared secret validated in this function
 *   SUPABASE_SERVICE_ROLE_KEY — used for the admin Supabase client
 *   NEXT_PUBLIC_SITE_URL   — forwarded to the notifications function
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobRow {
  id: string;
  title: string;
  slug: string;
}

interface PosterRow {
  poster_user_id: string | null;
  poster_email: string | null;
  poster_name: string | null;
}

interface LifecycleResult {
  published: number;
  expired: number;
  errors: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function notificationsUrl(): string {
  const base = Deno.env.get("SUPABASE_URL")!;
  return `${base}/functions/v1/notifications`;
}

function serviceRoleKey(): string {
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}

async function notifyPoster(
  posterUserId: string,
  subject: string,
  bodyHtml: string,
  idempotencyKey: string,
): Promise<void> {
  const res = await fetch(notificationsUrl(), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${serviceRoleKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient: posterUserId,
      channel: "email",
      subject,
      body: bodyHtml,
      idempotency_key: idempotencyKey,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`notifications responded ${res.status}: ${text}`);
  }
}

async function resolvePoster(
  // deno-lint-ignore no-explicit-any
  adminClient: any,
  jobId: string,
): Promise<PosterRow | null> {
  const { data, error } = await adminClient.rpc("job_poster_recipient", {
    p_job_id: jobId,
  });

  if (error) {
    console.warn(`jobs-lifecycle: job_poster_recipient(${jobId}) error:`, error.message);
    return null;
  }

  if (!data || data.length === 0) return null;
  return data[0] as PosterRow;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Auth: CRON_SECRET bearer only ─────────────────────────────────────────
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

  // ── Admin client (service role — no user JWT needed) ──────────────────────
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceRoleKey(),
    { auth: { persistSession: false } },
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

          const jobUrl = `${siteUrl}/jobs/${job.slug}`;
          await notifyPoster(
            poster.poster_user_id,
            `Anunțul tău „${job.title}" a fost publicat`,
            `<p>Salut${poster.poster_name ? `, <strong>${poster.poster_name}</strong>` : ""},</p>
             <p>Anunțul tău de muncă <strong>${job.title}</strong> a fost publicat automat pe <a href="${siteUrl}">LegalJobs</a>.</p>
             <p><a href="${jobUrl}">Vizualizează anunțul</a></p>`,
            `job-published-${job.id}`,
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
        .update({
          status: "archived",
          is_archived: true,
          archived_at: now,
        })
        .in("id", ids);

      if (updateErr) throw updateErr;

      result.expired = jobs.length;
      console.log(`jobs-lifecycle: expired ${jobs.length} job(s)`);

      for (const job of jobs) {
        try {
          const poster = await resolvePoster(adminClient, job.id);
          if (!poster?.poster_user_id) continue;

          const dashboardUrl = `${siteUrl}/dashboard/jobs`;
          await notifyPoster(
            poster.poster_user_id,
            `Anunțul tău „${job.title}" a expirat`,
            `<p>Salut${poster.poster_name ? `, <strong>${poster.poster_name}</strong>` : ""},</p>
             <p>Anunțul tău de muncă <strong>${job.title}</strong> a expirat și a fost dezactivat automat.</p>
             <p>Poți oricând să republici sau să extinzi durata anunțului din <a href="${dashboardUrl}">panoul de control</a>.</p>`,
            `job-expired-${job.id}`,
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
