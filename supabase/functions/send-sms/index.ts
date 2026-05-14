/**
 * send-sms — Supabase Edge Function (mock)
 *
 * Mock SMS sender. Logs the message and inserts a record into public.notifications
 * with `data._sms_mock: true`. Replace the body with a real Twilio/Vonage call
 * when an SMS provider is configured.
 *
 * Auth: SUPABASE_SERVICE_ROLE_KEY bearer (internal — called by notifications dispatcher).
 *
 * Body: { user_id: string, phone: string, message: string }
 *
 * Required secrets:
 *   SUPABASE_SERVICE_ROLE_KEY — for DB writes
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

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey || token !== serviceKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // deno-lint-ignore no-explicit-any
  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = typeof body.user_id === "string" ? body.user_id : null;
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!userId || !phone || !message) {
    return new Response(JSON.stringify({ error: "user_id, phone, and message are required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Mock: log + insert notification row ─────────────────────────────────────
  console.log(`[send-sms MOCK] to=${phone} user=${userId}: ${message}`);

  const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey, {
    auth: { persistSession: false },
  });

  const { error: insertErr } = await adminClient.from("notifications").insert({
    user_id: userId,
    title: "SMS",
    body: message,
    type: "sms_mock",
    data: { _sms_mock: true, phone, message },
  });

  if (insertErr) {
    console.warn("send-sms: feed insert failed:", insertErr.message);
  }

  return new Response(
    JSON.stringify({ ok: true, mock: true, to: phone }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
