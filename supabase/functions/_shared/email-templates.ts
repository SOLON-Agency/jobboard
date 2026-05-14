import appSettings from "../../../src/config/app.settings.json" with { type: "json" };

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const BRAND_BG = "#03170C";
const BRAND_FG = "#F0EBD8";
const BRAND_ACCENT = "#4CAF50";
const BODY_BG = "#F6F8F5";
const CARD_BG = "#FFFFFF";
const TEXT_MAIN = "#1A2B1F";
const TEXT_MUTED = "#6B7C70";

// ─── Template helpers ─────────────────────────────────────────────────────────

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
      font-family:'Saira','Segoe UI',Arial,sans-serif;
      font-weight:700;
      font-size:15px;
      letter-spacing:0.3px;
    ">${label}</a>
  `;
}

export function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:6px 12px 6px 0;color:${TEXT_MUTED};font-family:'Saira','Segoe UI',Arial,sans-serif;font-size:13px;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="padding:6px 0;color:${TEXT_MAIN};font-family:'Saira','Segoe UI',Arial,sans-serif;font-size:14px;font-weight:600;">${value}</td>
    </tr>
  `;
}

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
  siteName = appSettings.name,
}: BuildEmailOptions): string {
  const cta = ctaUrl && ctaLabel ? ctaButton(ctaUrl, ctaLabel) : "";

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${heading}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Saira:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Saira:ital,wght@0,100..900;1,100..900&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background:${BODY_BG};font-family:'Saira','Segoe UI',Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;</div>` : ""}

  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BODY_BG};padding:32px 16px;font-family:'Saira','Segoe UI',Arial,sans-serif;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <tr>
          <td style="
            background:${CARD_BG};
            border-radius:12px 12px 0 0;
            padding:20px 32px;
            border:1px solid #E2E8E0;
            border-bottom:none;
          ">
            <img
              src="https://i.ibb.co/xtwhB30G/footer-logo.webp"
              alt="${siteName}"
              width="180"
              style="display:block;height:auto;max-width:180px;border:0;"
            />
          </td>
        </tr>

        <tr>
          <td style="
            background:${CARD_BG};
            border-radius:0 0 12px 12px;
            padding:32px 32px 28px;
            border:1px solid #E2E8E0;
            border-top:none;
          ">
            <div style="width:40px;height:4px;background:${BRAND_ACCENT};border-radius:2px;margin-bottom:24px;"></div>

            <h1 style="
              margin:0 0 16px;
              color:${TEXT_MAIN};
              font-family:'Saira','Segoe UI',Arial,sans-serif;
              font-size:22px;
              font-weight:800;
              line-height:1.3;
            ">${heading}</h1>

            <div style="color:${TEXT_MAIN};font-family:'Saira','Segoe UI',Arial,sans-serif;font-size:15px;line-height:1.7;">
              ${bodyHtml}
            </div>

            ${cta}
          </td>
        </tr>

        <tr>
          <td style="padding:20px 0 8px;text-align:center;">
            <p style="margin:0;color:${TEXT_MUTED};font-family:'Saira','Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.6;">
              Ai primit acest email deoarece ești înregistrat pe
              <a href="${siteUrl}" style="color:${TEXT_MUTED};">${siteName}</a>.
              <br/>Răspunde la acest email dacă ai întrebări sau ai nevoie de ajutor.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
