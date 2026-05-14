/**
 * unclaimed-companies-nudge — Supabase Edge Function (daily cron)
 *
 * Runs Mon–Sat at 09:00 Europe/Bucharest (scheduled via pg_cron).
 * For every unclaimed company that has a contact email, sends a highly
 * persuasive, urgency-driven email nudge urging them to claim the company
 * and manage their job applications — for free.
 *
 * Subject lines rotate by day of week so the inbox never sees the same
 * message twice in a row.
 *
 * Authentication: Bearer <CRON_SECRET>
 *
 * Required Supabase secrets:
 *   CRON_SECRET               — shared secret validated in this function
 *   SUPABASE_SERVICE_ROLE_KEY — used for the admin Supabase client
 *   NEXT_PUBLIC_SITE_URL      — canonical site origin
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UnclaimedCompany {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface ClaimToken {
  company_id: string;
  token: string;
  expires_at: string;
  consumed_at: string | null;
}

interface NudgeResult {
  processed: number;
  skipped: number;
  errors: string[];
}

// ─── Day-of-week subject rotation ─────────────────────────────────────────────
//
// The copy is intentionally direct, specific, and emotionally resonant.
// Day 0 = Sunday (never runs, cron is Mon–Sat), day 1 = Monday … day 6 = Saturday.

function getSubject(
  dayOfWeek: number,
  companyName: string,
  applicationsLast7d: number,
  daysSincePosted: number,
  code: string
): string {
  switch (dayOfWeek) {
    case 1: // Monday
      return `Săptămână nouă, ${applicationsLast7d} candidați te-au căutat — profilul tău e încă nerevendicat`;
    case 2: // Tuesday
      return `${companyName}: candidați eligibili așteaptă un răspuns de ${daysSincePosted} zile`;
    case 3: // Wednesday
      return `Ești la 30 de secunde de a activa contul ${companyName} — gratuit, fără card`;
    case 4: // Thursday
      return `Concurenții tăi au răspuns deja celor mai buni candidați. Tu?`;
    case 5: // Friday
      return `Înainte de weekend: nu pierde candidatul care a aplicat ieri la ${companyName}`;
    case 6: // Saturday
      return `Ultimul memento al săptămânii — codul tău ${code} expiră dacă nu acționezi`;
    default:
      return `${companyName}, candidații te așteaptă — revendică profilul acum`;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function notificationsUrl(): string {
  return `${Deno.env.get("SUPABASE_URL")!}/functions/v1/notifications`;
}

// deno-lint-ignore no-explicit-any
async function invokeNotifications(serviceKey: string, body: Record<string, unknown>): Promise<void> {
  const res = await fetch(notificationsUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`notifications invoke failed ${res.status}: ${text}`);
  }
}

/**
 * Issues a new claim token via the Postgres RPC.
 * Returns the plaintext code (not stored in DB) and the opaque token UUID.
 */
// deno-lint-ignore no-explicit-any
async function issueOrRotateToken(adminClient: any, companyId: string): Promise<{ code: string; token: string }> {
  const { data, error } = await adminClient.rpc("issue_company_claim_token", {
    p_company_id: companyId,
  });
  if (error) throw new Error(`issue_company_claim_token: ${error.message}`);
  const row = data?.[0];
  if (!row) throw new Error("issue_company_claim_token returned no data");
  return { code: row.code, token: row.token };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Auth: CRON_SECRET bearer only ─────────────────────────────────────────
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) {
    return new Response(JSON.stringify({ error: "CRON_SECRET not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token || token !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const siteUrl = (Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000").replace(/\/$/, "");

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceKey,
    { auth: { persistSession: false } }
  );

  const result: NudgeResult = { processed: 0, skipped: 0, errors: [] };

  // ── Fetch unclaimed companies with an email address ────────────────────────
  const { data: companies, error: fetchError } = await adminClient
    .from("companies")
    .select("id, name, email, created_at")
    .eq("is_claimed", false)
    .eq("is_archived", false)
    .not("email", "is", null);

  if (fetchError) {
    console.error("unclaimed-companies-nudge: fetch error", fetchError.message);
    return new Response(
      JSON.stringify({ error: fetchError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun … 6=Sat (cron runs 1–6)

  for (const company of (companies ?? []) as UnclaimedCompany[]) {
    if (!company.email) {
      result.skipped++;
      continue;
    }

    try {
      // Ensure a valid (non-consumed, non-expired) token exists; rotate if needed.
      const { data: existingToken } = await adminClient
        .from("company_claim_tokens")
        .select("company_id, token, expires_at, consumed_at")
        .eq("company_id", company.id)
        .maybeSingle() as { data: ClaimToken | null };

      let code: string;
      let claimToken: string;

      const tokenIsValid =
        existingToken &&
        !existingToken.consumed_at &&
        new Date(existingToken.expires_at) > today;

      if (tokenIsValid && existingToken) {
        // We don't store the plaintext code, so we must rotate to get it back.
        // Rotation resets the expiry — acceptable cost.
        const rotated = await issueOrRotateToken(adminClient, company.id);
        code = rotated.code;
        claimToken = rotated.token;
      } else {
        const issued = await issueOrRotateToken(adminClient, company.id);
        code = issued.code;
        claimToken = issued.token;
      }

      // Fetch application stats for persuasion copy.
      const { count: totalApplications } = await adminClient
        .from("job_applications")
        .select("id", { count: "exact", head: true })
        .in(
          "job_id",
          (await adminClient
            .from("job_listings")
            .select("id")
            .eq("company_id", company.id)).data?.map((j: { id: string }) => j.id) ?? []
        );

      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: applicationsLast7d } = await adminClient
        .from("job_applications")
        .select("id", { count: "exact", head: true })
        .in(
          "job_id",
          (await adminClient
            .from("job_listings")
            .select("id")
            .eq("company_id", company.id)).data?.map((j: { id: string }) => j.id) ?? []
        )
        .gte("created_at", sevenDaysAgo.toISOString());

      const daysSincePosted = Math.floor(
        (today.getTime() - new Date(company.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      const claimUrl = `${siteUrl}/claim?token=${claimToken}`;
      const subject = getSubject(
        dayOfWeek,
        company.name,
        applicationsLast7d ?? 0,
        daysSincePosted,
        code
      );

      await invokeNotifications(serviceKey, {
        to_email: company.email,
        to_name: company.name,
        channel: "email",
        subject,
        resend_template: {
          id: "unclaimed-company-nudge",
          variables: {
            companyName: company.name,
            applicationsLast7d: applicationsLast7d ?? 0,
            totalApplications: totalApplications ?? 0,
            daysSincePosted,
            claimUrl,
            code,
            siteUrl,
            dayOfWeek: String(dayOfWeek),
          },
        },
        idempotency_key: `unclaimed-nudge/${company.id}/${today.toISOString().slice(0, 10)}`,
      });

      // Log the nudge
      await adminClient.from("company_claim_nudge_log").insert({
        company_id: company.id,
        sent_to: company.email,
        status: "sent",
      });

      result.processed++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`unclaimed-companies-nudge: error for company ${company.id}:`, message);

      await adminClient.from("company_claim_nudge_log").insert({
        company_id: company.id,
        sent_to: company.email,
        status: "error",
      }).catch(() => {});

      result.errors.push(`${company.id}: ${message}`);
    }
  }

  console.log("unclaimed-companies-nudge complete:", JSON.stringify(result));

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
