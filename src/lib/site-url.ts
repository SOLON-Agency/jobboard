/**
 * Canonical site origin for absolute URLs (sitemap, robots, metadata).
 *
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL — set in production (e.g. https://yourdomain.ro).
 * 2. VERCEL_PROJECT_PRODUCTION_URL — primary production hostname (Vercel production deploy only).
 * 3. VERCEL_URL — deployment host (*.vercel.app or preview URLs).
 * 4. localhost for local development.
 *
 * Compute inside route handlers / sitemap generators so values reflect the active environment.
 */
export function canonicalSiteOrigin(): string {
  const explicitRaw =
    typeof process.env.NEXT_PUBLIC_SITE_URL === "string"
      ? process.env.NEXT_PUBLIC_SITE_URL.trim()
      : "";
  if (explicitRaw.length > 0) return normalizeOrigin(explicitRaw);

  const hostnameOnly = (v: string | undefined): string =>
    typeof v !== "string" ? ""
      : v.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");

  const prodHost = hostnameOnly(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (prodHost.length > 0 && process.env.VERCEL_ENV === "production") {
    return `https://${prodHost}`;
  }

  const vercelHost = hostnameOnly(process.env.VERCEL_URL);
  if (vercelHost.length > 0) return `https://${vercelHost}`;

  return "http://localhost:3000";
}

function normalizeOrigin(value: string): string {
  const withProtocol =
    /^https?:\/\//i.test(value) ? value.trim() : `https://${value.trim()}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return withProtocol.replace(/\/+$/, "");
  }
}
