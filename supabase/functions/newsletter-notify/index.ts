/**
 * newsletter-notify — Supabase Edge Function
 *
 * Invoked (fire-and-forget) by the Next.js publish Server Action when a blog
 * post transitions to `status = 'published'` for the first time.
 *
 * Responsibilities:
 * 1. Validate caller is an admin (via JWT → profiles.role).
 * 2. Load the blog post (must be published, notified_at must be NULL).
 * 3. Load all active newsletter subscribers.
 * 4. Fan-out emails via Resend batch.send in chunks of 100.
 * 5. Stamp blog_posts.notified_at = now() to prevent duplicate sends.
 *
 * Idempotency: per-recipient idempotency key prevents duplicate delivery on
 * retry. The notified_at guard prevents re-triggering from a re-publish.
 *
 * Required secrets: RESEND_API_KEY, RESEND_FROM, SUPABASE_URL,
 *                   SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL.
 *
 * Body: { post_id: string }
 * Auth: Supabase user JWT (must be admin role).
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { buildEmail } from "../_shared/email-templates.ts";

const CHUNK_SIZE = 100;

interface BatchEmailPayload {
  from: string;
  to: string;
  subject: string;
  html: string;
  headers?: Record<string, string>;
  idempotency_key?: string;
}

async function sendBatch(
  resendApiKey: string,
  batch: BatchEmailPayload[]
): Promise<void> {
  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(batch),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend batch error ${res.status}: ${text}`);
  }
}

/** Simple FNV-1a hash for stable per-recipient idempotency keys. */
function hashString(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleCors();

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const resendFrom = Deno.env.get("RESEND_FROM") ?? "";
  const siteUrl = Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "https://example.com";

  if (!serviceRoleKey || !resendApiKey || !resendFrom) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing required secrets" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Auth: verify JWT and admin role ────────────────────────────────────────
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");

  const anonClient = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: `Bearer ${jwt}` } } }
  );

  const {
    data: { user },
    error: authErr,
  } = await anonClient.auth.getUser();
  if (authErr || !user) {
    return new Response(
      JSON.stringify({ ok: false, error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return new Response(
      JSON.stringify({ ok: false, error: "Admin role required" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: { post_id?: string };
  try {
    body = await req.json() as { post_id?: string };
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { post_id } = body;
  if (!post_id) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing post_id" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Load post (must be published and not yet notified) ─────────────────────
  const { data: post, error: postErr } = await serviceClient
    .from("blog_posts")
    .select("id, title, slug, excerpt, cover_image_url, seo_title, notified_at, status")
    .eq("id", post_id)
    .single();

  if (postErr || !post) {
    return new Response(
      JSON.stringify({ ok: false, error: "Post not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (post.status !== "published") {
    return new Response(
      JSON.stringify({ ok: true, skipped: "Post is not published" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (post.notified_at) {
    return new Response(
      JSON.stringify({ ok: true, skipped: "Already notified" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Load active subscribers ────────────────────────────────────────────────
  const { data: subscribers, error: subsErr } = await serviceClient
    .from("newsletter_subscribers")
    .select("email")
    .eq("is_active", true);

  if (subsErr) {
    return new Response(
      JSON.stringify({ ok: false, error: subsErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!subscribers || subscribers.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, sent: 0, skipped: "No active subscribers" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Build email HTML ───────────────────────────────────────────────────────
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const subject = post.seo_title ?? post.title;
  const coverImg = post.cover_image_url
    ? `<img src="${post.cover_image_url}" alt="${post.title}" width="520" style="display:block;max-width:100%;height:auto;border-radius:8px;margin:0 0 20px;" />`
    : "";
  const bodyHtml = `
    ${coverImg}
    <p>${post.excerpt ?? post.title}</p>
  `;

  const html = buildEmail({
    heading: post.title,
    preheader: post.excerpt ?? post.title,
    bodyHtml,
    ctaUrl: postUrl,
    ctaLabel: "Citește articolul",
    siteUrl,
  });

  // ── Fan-out in batches of CHUNK_SIZE ───────────────────────────────────────
  let sent = 0;
  const emails = subscribers.map((s) => s.email as string);

  for (let i = 0; i < emails.length; i += CHUNK_SIZE) {
    const chunk = emails.slice(i, i + CHUNK_SIZE);
    const batch: BatchEmailPayload[] = chunk.map((to) => ({
      from: resendFrom,
      to,
      subject,
      html,
      headers: {
        "List-Unsubscribe": `<mailto:${resendFrom}?subject=Dezabonare>`,
      },
      idempotency_key: `blog-${post_id}-${hashString(to)}`,
    }));

    try {
      await sendBatch(resendApiKey, batch);
      sent += chunk.length;
    } catch (err) {
      console.error("Batch send failed:", err);
      // Continue with remaining chunks; partial success is better than nothing.
    }
  }

  // ── Mark post as notified (idempotent UPDATE) ──────────────────────────────
  await serviceClient
    .from("blog_posts")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", post_id)
    .is("notified_at", null);

  return new Response(
    JSON.stringify({ ok: true, sent, total: emails.length }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
