/**
 * notifications-release-detect — Supabase Edge Function
 *
 * Compares the current app version (passed in the POST body or read from
 * a deployed `app_version` secret) against `app_state.last_announced_version`.
 *
 * When a new minor or major version is detected:
 *   1. Inserts a DRAFT row into `app_release_announcements` if none exists for
 *      that version yet.
 *   2. Sends an in-app notification to all platform admins so they know to
 *      fill in the release notes and publish.
 *
 * Actual broadcasting to all users happens when an admin clicks "Publish" in
 * the /dashboard/admin/releases page (see ReleasesClient.tsx).
 *
 * Authentication: Bearer <CRON_SECRET>
 *
 * Body (optional): { version: string }  — if omitted reads APP_VERSION secret
 *
 * Required secrets: CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

function serviceKey(): string {
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}

function notificationsUrl(): string {
  return `${Deno.env.get("SUPABASE_URL")!}/functions/v1/notifications`;
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

function isNewerVersion(current: string, announced: string): boolean {
  const parse = (v: string) => v.replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
  const [cMaj, cMin] = parse(current);
  const [aMaj, aMin] = parse(announced);
  if (cMaj !== aMaj) return cMaj > aMaj;
  return cMin > aMin;
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

  let bodyJson: Record<string, unknown> = {};
  try {
    const text = await req.text();
    if (text) bodyJson = JSON.parse(text) as Record<string, unknown>;
  } catch { /* ignore */ }

  const currentVersion =
    (typeof bodyJson.version === "string" ? bodyJson.version : null) ??
    Deno.env.get("APP_VERSION") ??
    "0.1.0";

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey(), {
    auth: { persistSession: false },
  });

  // Read last announced version
  const { data: stateRow } = await admin
    .from("app_state")
    .select("value")
    .eq("key", "last_announced_version")
    .maybeSingle();

  const lastAnnounced = (stateRow as { value: string } | null)?.value ?? "0.0.0";

  if (!isNewerVersion(currentVersion, lastAnnounced)) {
    return new Response(
      JSON.stringify({ ok: true, skipped: true, reason: `${currentVersion} is not newer than last announced ${lastAnnounced}` }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // Check if a draft for this version already exists
  const { data: existing } = await admin
    .from("app_release_announcements")
    .select("id")
    .eq("version", currentVersion)
    .maybeSingle();

  if (!existing) {
    const { error: insertErr } = await admin.from("app_release_announcements").insert({
      version: currentVersion,
      title: `Noutăți versiunea ${currentVersion}`,
      body_html: `<p>Actualizare ${currentVersion} disponibilă. Editați conținutul și publicați anunțul pentru a notifica toți utilizatorii.</p>`,
      draft: true,
    });

    if (insertErr) {
      console.error("notifications-release-detect: insert failed:", insertErr.message);
      return new Response(JSON.stringify({ ok: false, error: insertErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Notify platform admins in-app
  const { data: adminProfiles } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  const adminIds = (adminProfiles ?? []).map((p: { id: string }) => p.id);

  if (adminIds.length > 0) {
    try {
      await dispatch({
        type: "release_announcement",
        recipients: adminIds,
        channels: ["browser"], // in-app / push only — email blast happens when admin publishes
        data: {
          version: currentVersion,
          title: `Versiune nouă detectată: v${currentVersion}`,
          body_html: `<p>O versiune nouă (v${currentVersion}) a fost detectată. Publicați notificarea pentru a informa toți utilizatorii.</p>`,
        },
        idempotency_key: `release-detect/${currentVersion}`,
      });
    } catch (e) {
      console.warn("notifications-release-detect: admin notify failed:", e);
    }
  }

  console.log(`notifications-release-detect: new version ${currentVersion} detected (last: ${lastAnnounced})`);
  return new Response(
    JSON.stringify({ ok: true, version: currentVersion, draft_created: !existing }),
    { headers: { "Content-Type": "application/json" } }
  );
});
