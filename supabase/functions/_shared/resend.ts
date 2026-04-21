/**
 * Thin wrapper around the Resend HTTP API.
 *
 * Deno-compatible — no Node.js SDK required.
 *
 * Required env vars (set as Supabase secrets):
 *   RESEND_API_KEY  — API key from https://resend.com/api-keys
 *   RESEND_FROM     — verified sender, e.g. "LegalJobs <noreply@yourdomain.com>"
 */

export interface ResendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  /**
   * Idempotency key — prevents duplicate delivery on retries.
   * Pattern: "<event-type>/<entity-id>". Expires after 24 h, max 256 chars.
   */
  idempotencyKey?: string;
}

/** Resend dashboard template send — see https://resend.com/docs/api-reference/emails/send-email */
export interface ResendTemplateEmailOptions {
  to: string | string[];
  /** Overrides template default when set. */
  subject?: string;
  template: {
    id: string;
    variables: Record<string, string | number>;
  };
  idempotencyKey?: string;
}

/**
 * Sends a single HTML email via the Resend HTTP API.
 * Throws on API error so callers can decide how to handle it.
 */
export async function sendResendEmail(
  options: ResendEmailOptions
): Promise<{ id: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY")?.trim();
  const from = Deno.env.get("RESEND_FROM")?.trim();

  if (!apiKey || !from) {
    throw new Error(
      "Resend not configured: RESEND_API_KEY and RESEND_FROM must be set as Supabase secrets."
    );
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  const to = Array.isArray(options.to) ? options.to : [options.to];

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({ from, to, subject: options.subject, html: options.html }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Resend API ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { id: string };
  return { id: data.id };
}

/**
 * Sends email using a published Resend template (`template.id` + `variables`).
 * Do not pass `html` / `text` / `react` in the same request as `template`.
 */
export async function sendResendTemplateEmail(
  options: ResendTemplateEmailOptions
): Promise<{ id: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY")?.trim();
  const from = Deno.env.get("RESEND_FROM")?.trim();

  if (!apiKey || !from) {
    throw new Error(
      "Resend not configured: RESEND_API_KEY and RESEND_FROM must be set as Supabase secrets."
    );
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  const to = Array.isArray(options.to) ? options.to : [options.to];

  const payload: Record<string, unknown> = {
    from,
    to,
    template: {
      id: options.template.id,
      variables: options.template.variables,
    },
  };
  const sub = options.subject?.trim();
  if (sub) payload.subject = sub;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Resend API ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { id: string };
  return { id: data.id };
}

/** Returns true when RESEND_API_KEY and RESEND_FROM are both configured. */
export function isResendConfigured(): boolean {
  return !!(
    Deno.env.get("RESEND_API_KEY")?.trim() &&
    Deno.env.get("RESEND_FROM")?.trim()
  );
}
