/**
 * notifications-matchmaking — Supabase Edge Function (daily cron)
 *
 * Runs daily at 08:15 Europe/Bucharest (05:15 UTC).
 *
 * For companies AND profiles both updated in the last 24 h it computes the
 * intersection of approved competencies. Pairs that meet the minimum overlap
 * threshold get an email + browser notification sent to both the candidate and
 * every company member.  A row in public.matches is upserted; re-notification
 * only happens when the overlap set changed since the previous match.
 *
 * Authentication: Bearer <CRON_SECRET>
 *
 * Required secrets: CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL
 * Optional env:     MATCHMAKING_MIN_OVERLAP (integer, default 2)
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

/** Deterministic hash from a sorted list of skill ids (no crypto needed). */
function overlapHash(skillIds: string[]): string {
  return [...skillIds].sort().join("|");
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

  // deno-lint-ignore no-explicit-any
  let payload: Record<string, any> = {};
  try {
    payload = await req.json();
  } catch {
    // body is optional for cron calls
  }

  const minOverlap: number = Number(
    payload.min_overlap ??
    Deno.env.get("MATCHMAKING_MIN_OVERLAP") ??
    2
  );

  const siteUrl = (Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "https://legaljobs.ro").replace(/\/$/, "");
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey(), {
    auth: { persistSession: false },
  });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // ── 1. Fetch recently-edited companies and profiles ───────────────────────

  const [{ data: recentCompanies }, { data: recentProfiles }] = await Promise.all([
    admin
      .from("companies")
      .select("id, slug, name")
      .gte("updated_at", since)
      .eq("is_archived", false),
    admin
      .from("profiles")
      .select("id, full_name, slug")
      .gte("updated_at", since),
  ]);

  if (!recentCompanies?.length || !recentProfiles?.length) {
    console.log("notifications-matchmaking: no recently-edited pairs, skipping.");
    return new Response(
      JSON.stringify({ ok: true, sent: 0, skipped: "no recent edits on both sides" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  const companyIds = recentCompanies.map((c: { id: string }) => c.id);
  const profileUserIds = recentProfiles.map((p: { id: string }) => p.id);

  // ── 2. Bulk-fetch approved skills for those companies and profiles ─────────

  const [{ data: companySkillRows }, { data: profileSkillRows }] = await Promise.all([
    admin
      .from("company_skills")
      .select("company_id, skill_id, skills!skill_id(id, name, is_approved)")
      .in("company_id", companyIds),
    admin
      .from("profile_skills")
      .select("user_id, skill_id, skills!skill_id(id, name, is_approved)")
      .in("user_id", profileUserIds),
  ]);

  // Build skill maps: companyId → Set<skillId>, companyId → Map<skillId, name>
  type SkillRow = { id: string; name: string; is_approved: boolean };

  const companySkillMap = new Map<string, Map<string, string>>(); // company_id → (skill_id → skill_name)
  for (const row of (companySkillRows ?? []) as { company_id: string; skill_id: string; skills: SkillRow | null }[]) {
    if (!row.skills?.is_approved) continue;
    if (!companySkillMap.has(row.company_id)) companySkillMap.set(row.company_id, new Map());
    companySkillMap.get(row.company_id)!.set(row.skill_id, row.skills.name);
  }

  const profileSkillMap = new Map<string, Map<string, string>>(); // user_id → (skill_id → skill_name)
  for (const row of (profileSkillRows ?? []) as { user_id: string; skill_id: string; skills: SkillRow | null }[]) {
    if (!row.skills?.is_approved) continue;
    if (!profileSkillMap.has(row.user_id)) profileSkillMap.set(row.user_id, new Map());
    profileSkillMap.get(row.user_id)!.set(row.skill_id, row.skills.name);
  }

  // ── 3. Fetch existing matches for these company × profile pairs ───────────

  const { data: existingMatches } = await admin
    .from("matches")
    .select("id, company_id, user_id, overlap_hash")
    .in("company_id", companyIds)
    .in("user_id", profileUserIds);

  const existingMatchMap = new Map<string, { id: string; overlap_hash: string }>();
  for (const m of (existingMatches ?? []) as { id: string; company_id: string; user_id: string; overlap_hash: string }[]) {
    existingMatchMap.set(`${m.company_id}|${m.user_id}`, { id: m.id, overlap_hash: m.overlap_hash });
  }

  // ── 4. Fetch company_users for recently-edited companies (for notifications) ──

  const { data: companyUserRows } = await admin
    .from("company_users")
    .select("company_id, user_id")
    .in("company_id", companyIds);

  const companyUsersMap = new Map<string, string[]>(); // company_id → [user_id]
  for (const cu of (companyUserRows ?? []) as { company_id: string; user_id: string }[]) {
    if (!companyUsersMap.has(cu.company_id)) companyUsersMap.set(cu.company_id, []);
    companyUsersMap.get(cu.company_id)!.push(cu.user_id);
  }

  // ── 5. Cross-product: compute overlaps, upsert matches, dispatch ──────────

  type Company = { id: string; slug: string | null; name: string };
  type Profile = { id: string; full_name: string | null; slug: string | null };

  let sent = 0;
  const errors: string[] = [];

  for (const company of (recentCompanies as Company[])) {
    const cSkills = companySkillMap.get(company.id);
    if (!cSkills || cSkills.size === 0) continue;

    for (const profile of (recentProfiles as Profile[])) {
      const pSkills = profileSkillMap.get(profile.id);
      if (!pSkills || pSkills.size === 0) continue;

      // Compute intersection
      const overlapIds: string[] = [];
      const overlapNames: string[] = [];
      for (const [skillId, skillName] of cSkills) {
        if (pSkills.has(skillId)) {
          overlapIds.push(skillId);
          overlapNames.push(skillName);
        }
      }

      if (overlapIds.length < minOverlap) continue;

      const hash = overlapHash(overlapIds);
      const pairKey = `${company.id}|${profile.id}`;
      const existing = existingMatchMap.get(pairKey);

      if (existing && existing.overlap_hash === hash) {
        // No change — skip dispatch
        continue;
      }

      // Upsert the match row
      const now = new Date().toISOString();
      const matchPayload = {
        company_id: company.id,
        user_id: profile.id,
        overlap: overlapNames.sort(),
        overlap_hash: hash,
        last_notified_at: now,
      };

      try {
        if (existing) {
          await admin.from("matches").update(matchPayload).eq("id", existing.id);
        } else {
          await admin.from("matches").insert(matchPayload);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`upsert ${pairKey}: ${msg}`);
        console.warn("notifications-matchmaking: upsert failed", pairKey, msg);
        continue;
      }

      const idempotencyBase = `matchmaking/${company.id}/${profile.id}/${hash}`;

      // Notify candidate
      try {
        await dispatch({
          type: "matchmaking",
          recipients: [profile.id],
          data: {
            audience: "candidate",
            company_id: company.id,
            company_name: company.name,
            company_slug: company.slug,
            overlap: overlapNames.sort(),
            match_count: overlapIds.length,
            site_url: siteUrl,
          },
          idempotency_key: `${idempotencyBase}/candidate`,
        });
        sent++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`candidate ${profile.id}: ${msg}`);
        console.warn("notifications-matchmaking: candidate dispatch failed", profile.id, msg);
      }

      // Notify company members
      const memberIds = companyUsersMap.get(company.id) ?? [];
      if (memberIds.length > 0) {
        try {
          await dispatch({
            type: "matchmaking",
            recipients: memberIds,
            data: {
              audience: "company",
              company_id: company.id,
              user_id: profile.id,
              user_full_name: profile.full_name,
              user_slug: profile.slug,
              overlap: overlapNames.sort(),
              match_count: overlapIds.length,
              site_url: siteUrl,
            },
            idempotency_key: `${idempotencyBase}/company`,
          });
          sent += memberIds.length;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push(`company members ${company.id}: ${msg}`);
          console.warn("notifications-matchmaking: company dispatch failed", company.id, msg);
        }
      }
    }
  }

  console.log(`notifications-matchmaking: sent=${sent} errors=${errors.length}`);
  return new Response(
    JSON.stringify({ ok: true, sent, errors }),
    { headers: { "Content-Type": "application/json" } }
  );
});
