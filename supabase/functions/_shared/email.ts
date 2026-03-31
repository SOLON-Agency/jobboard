/**
 * Shared email utilities for Supabase Edge Functions.
 * Provides a consistent branded HTML email shell and an SMTP transport factory.
 */

import nodemailer from "npm:nodemailer@6";

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const BRAND_BG = "#03170C";
const BRAND_FG = "#F0EBD8";
const BRAND_ACCENT = "#4CAF50";
const BODY_BG = "#F6F8F5";
const CARD_BG = "#FFFFFF";
const TEXT_MAIN = "#1A2B1F";
const TEXT_MUTED = "#6B7C70";

// ─── CTA button ───────────────────────────────────────────────────────────────

function ctaButton(url: string, label: string): string {
  return `
    <a href="${url}" style="
      display:inline-block;
      margin-top:20px;
      padding:12px 28px;
      background:${BRAND_BG};
      color:${BRAND_FG};
      text-decoration:none;
      border-radius:8px;
      font-weight:700;
      font-size:15px;
      letter-spacing:0.3px;
    ">${label}</a>
  `;
}

// ─── Detail row (label / value pair) ──────────────────────────────────────────

export function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:6px 12px 6px 0;color:${TEXT_MUTED};font-size:13px;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="padding:6px 0;color:${TEXT_MAIN};font-size:14px;font-weight:600;">${value}</td>
    </tr>
  `;
}

// ─── Info table wrapper ────────────────────────────────────────────────────────

export function infoTable(rows: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="
      margin:20px 0;
      background:${BODY_BG};
      border-radius:8px;
      padding:14px 16px;
    ">
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ─── Full email shell ──────────────────────────────────────────────────────────

export interface BuildEmailOptions {
  preheader?: string;
  heading: string;
  bodyHtml: string;
  ctaUrl?: string;
  ctaLabel?: string;
  siteUrl: string;
  siteName?: string;
}

export function buildEmail({
  preheader = "",
  heading,
  bodyHtml,
  ctaUrl,
  ctaLabel,
  siteUrl,
  siteName = "Jobboard",
}: BuildEmailOptions): string {
  const cta = ctaUrl && ctaLabel ? ctaButton(ctaUrl, ctaLabel) : "";

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:${BODY_BG};font-family:'Segoe UI',Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;</div>` : ""}

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BODY_BG};padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Header bar -->
        <tr>
          <td style="
            background:${BRAND_BG};
            border-radius:12px 12px 0 0;
            padding:20px 32px;
          ">
            <span style="
              color:${BRAND_FG};
              font-size:20px;
              font-weight:800;
              letter-spacing:-0.5px;
            ">${siteName}</span>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="
            background:${CARD_BG};
            border-radius:0 0 12px 12px;
            padding:32px 32px 28px;
            border:1px solid #E2E8E0;
            border-top:none;
          ">
            <!-- Accent line -->
            <div style="width:40px;height:4px;background:${BRAND_ACCENT};border-radius:2px;margin-bottom:24px;"></div>

            <h1 style="
              margin:0 0 16px;
              color:${TEXT_MAIN};
              font-size:22px;
              font-weight:800;
              line-height:1.3;
            ">${heading}</h1>

            <div style="color:${TEXT_MAIN};font-size:15px;line-height:1.7;">
              ${bodyHtml}
            </div>

            ${cta}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 0 8px;text-align:center;">
            <p style="margin:0;color:${TEXT_MUTED};font-size:12px;line-height:1.6;">
              Ai primit acest email deoarece ești înregistrat pe 
              <a href="${siteUrl}" style="color:${TEXT_MUTED};">${siteName}</a>.
              <br/>Nu răspunde la acest email — este trimis automat.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── SMTP transport factory ────────────────────────────────────────────────────

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export function getSmtpConfig(): SmtpConfig | null {
  const host = Deno.env.get("SMTP_HOST");
  const port = parseInt(Deno.env.get("SMTP_PORT") ?? "587");
  const user = Deno.env.get("SMTP_USER");
  const pass = Deno.env.get("SMTP_PASS");
  const from = Deno.env.get("SMTP_FROM") ?? user ?? "noreply@jobboard.ro";

  if (!host || !user || !pass) return null;
  return { host, port, user, pass, from };
}

export function createTransport(cfg: SmtpConfig) {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
  });
}

// ─── CORS headers ─────────────────────────────────────────────────────────────

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export function okResponse(extra: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ ok: true, ...extra }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errResponse(err: unknown, status = 500) {
  return new Response(JSON.stringify({ error: String(err) }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
