/**
 * increase_company_engagement — Supabase Edge Function
 *
 * Increments `companies.engages` for a company the authenticated user belongs to.
 * Uses the existing `increment_company_engages` RPC under the caller's JWT (RLS).
 *
 * Request body (JSON):
 *   company_id  string  (required) — UUID of the company
 *
 * Response (JSON):
 *   { ok: true, engages: number } on success
 *   { error: string } on failure (4xx/5xx)
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Neautorizat." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user?.id) {
    return new Response(JSON.stringify({ error: "Neautorizat." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { company_id?: string };
  try {
    body = (await req.json()) as { company_id?: string };
  } catch {
    return new Response(JSON.stringify({ error: "JSON invalid." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const companyId = body.company_id?.trim();
  if (!companyId) {
    return new Response(JSON.stringify({ error: "company_id este obligatoriu." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: isMember, error: memberErr } = await supabase.rpc("is_company_member", {
    p_company_id: companyId,
    p_min_role: "member",
  });

  if (memberErr) {
    console.error("increase_company_engagement is_company_member:", memberErr);
    return new Response(JSON.stringify({ error: memberErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!isMember) {
    return new Response(
      JSON.stringify({ error: "Nu ai acces la această companie." }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const { error: rpcErr } = await supabase.rpc("increment_company_engages", {
    p_company_id: companyId,
  });

  if (rpcErr) {
    console.error("increase_company_engagement rpc:", rpcErr);
    return new Response(JSON.stringify({ error: rpcErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: companyRow, error: fetchErr } = await supabase
    .from("companies")
    .select("engages")
    .eq("id", companyId)
    .maybeSingle();

  if (fetchErr) {
    console.warn("increase_company_engagement fetch engages:", fetchErr);
    return new Response(
      JSON.stringify({
        ok: true,
        engages: null,
        message: "Engagement-ul a fost incrementat; nu s-a putut citi valoarea curentă.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      ok: true as const,
      engages: companyRow?.engages ?? null,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
