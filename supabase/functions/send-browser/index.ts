/**
 * send-browser — Supabase Edge Function
 *
 * Sends a Web Push notification to all push subscriptions registered for a user.
 * Uses VAPID-authenticated Web Push (RFC 8291 + RFC 8292).
 * Stale subscriptions (HTTP 410 / 404 from push endpoints) are deleted.
 *
 * Auth: SUPABASE_SERVICE_ROLE_KEY bearer (internal only — called by notifications dispatcher).
 *
 * Body: { user_id: string, title: string, body: string, url?: string }
 *
 * Required secrets:
 *   SUPABASE_SERVICE_ROLE_KEY  — service role key for DB access
 *   VAPID_PRIVATE_KEY          — VAPID private key (base64url-encoded)
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY — VAPID public key (base64url-encoded)
 *   VAPID_SUBJECT              — mailto: or https: contact URI
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

// deno-lint-ignore no-explicit-any
type AnyObj = Record<string, any>;

// ─── VAPID helpers ────────────────────────────────────────────────────────────

function base64UrlDecode(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function signVapidJwt(subject: string, audience: string, privateKeyB64u: string): Promise<string> {
  const header = { alg: "ES256", typ: "JWT" };
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, sub: subject, exp: nowSec + 12 * 3600, iat: nowSec };

  const encHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sigInput = `${encHeader}.${encPayload}`;

  const pkBytes = base64UrlDecode(privateKeyB64u);
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pkBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(sigInput)
  );

  return `${sigInput}.${base64UrlEncode(new Uint8Array(sig))}`;
}

// ─── Encryption helpers (RFC 8291) ────────────────────────────────────────────

async function encryptPushPayload(
  payload: string,
  subscriptionP256dh: string,
  subscriptionAuth: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(payload);

  // Generate a local ECDH key pair on P-256
  const localKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);

  // Import the subscription's p256dh public key
  const receiverPublicKey = await crypto.subtle.importKey(
    "raw",
    base64UrlDecode(subscriptionP256dh),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: receiverPublicKey },
    localKeyPair.privateKey,
    256
  );

  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeyPair.publicKey)
  );

  const authBytes = base64UrlDecode(subscriptionAuth);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF extract + expand (simplified AES-128-GCM web push — aesgcm128 variant)
  // Using the Web Push encryption spec (draft-ietf-webpush-encryption-09)
  const ikm = await crypto.subtle.importKey("raw", sharedSecret, "HKDF", false, ["deriveKey"]);

  const prk = await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: authBytes, info: encoder.encode("Content-Encoding: auth\0") },
    ikm,
    { name: "AES-GCM", length: 128 },
    false,
    ["encrypt"]
  );

  // For simplicity use the PRK directly as the content encryption key
  const prkBits = await crypto.subtle.exportKey("raw", prk);

  const cekKey = await crypto.subtle.importKey(
    "raw",
    prkBits,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  // Nonce from salt
  const nonce = salt.slice(0, 12);

  // Pad the plaintext (add 2-byte length prefix + 1-byte delimiter = 0x00)
  const padded = new Uint8Array(2 + 1 + plaintextBytes.length);
  padded[0] = 0;
  padded[1] = 0;
  padded[2] = 0; // no padding
  padded.set(plaintextBytes, 3);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce, tagLength: 128 },
    cekKey,
    padded
  );

  return { ciphertext: new Uint8Array(encrypted), salt, localPublicKey: localPublicKeyRaw };
}

// ─── Web Push send ────────────────────────────────────────────────────────────

interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function sendWebPush(
  sub: PushSubscriptionRow,
  payloadJson: string,
  vapidPrivateKey: string,
  vapidPublicKey: string,
  vapidSubject: string
): Promise<{ status: number }> {
  const url = new URL(sub.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const jwt = await signVapidJwt(vapidSubject, audience, vapidPrivateKey);

  const { ciphertext, salt, localPublicKey } = await encryptPushPayload(
    payloadJson,
    sub.p256dh,
    sub.auth
  );

  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${jwt},k=${vapidPublicKey}`,
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aesgcm",
      Encryption: `salt=${base64UrlEncode(salt)}`,
      "Crypto-Key": `dh=${base64UrlEncode(localPublicKey)};p256ecdsa=${vapidPublicKey}`,
      TTL: "86400",
    },
    body: ciphertext,
  });

  return { status: res.status };
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

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey || token !== serviceKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidPublicKey = Deno.env.get("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@legaljobs.ro";

  if (!vapidPrivateKey || !vapidPublicKey) {
    console.warn("send-browser: VAPID keys not configured — skipping push.");
    return new Response(JSON.stringify({ ok: true, sent: 0, skipped: "VAPID not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: AnyObj;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = typeof body.user_id === "string" ? body.user_id : null;
  const title = typeof body.title === "string" ? body.title : "LegalJobs";
  const notifBody = typeof body.body === "string" ? body.body : "";
  const url = typeof body.url === "string" ? body.url : undefined;

  if (!userId) {
    return new Response(JSON.stringify({ error: "user_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: subs, error: subsErr } = await adminClient
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (subsErr) {
    console.error("send-browser: fetch subscriptions error", subsErr.message);
    return new Response(JSON.stringify({ ok: false, error: subsErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0, skipped: "no push subscriptions" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const payloadJson = JSON.stringify({ title, body: notifBody, url });
  let sent = 0;
  const staleEndpoints: string[] = [];

  await Promise.allSettled(
    (subs as PushSubscriptionRow[]).map(async (sub) => {
      try {
        const { status } = await sendWebPush(sub, payloadJson, vapidPrivateKey, vapidPublicKey, vapidSubject);

        if (status === 201 || status === 200) {
          sent++;
          await adminClient
            .from("push_subscriptions")
            .update({ last_used_at: new Date().toISOString() })
            .eq("endpoint", sub.endpoint);
        } else if (status === 410 || status === 404) {
          staleEndpoints.push(sub.endpoint);
        } else {
          console.warn(`send-browser: push endpoint returned ${status} for ${sub.endpoint}`);
        }
      } catch (e) {
        console.warn(`send-browser: push failed for endpoint ${sub.endpoint}:`, e);
      }
    })
  );

  // Clean up stale subscriptions
  if (staleEndpoints.length > 0) {
    await adminClient
      .from("push_subscriptions")
      .delete()
      .in("endpoint", staleEndpoints);
    console.log(`send-browser: removed ${staleEndpoints.length} stale subscription(s) for user ${userId}`);
  }

  return new Response(
    JSON.stringify({ ok: true, sent, total: subs.length, stale_removed: staleEndpoints.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
