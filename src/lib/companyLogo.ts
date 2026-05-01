/**
 * Returns a safe http(s) URL for company logos, or undefined if missing/invalid.
 */
export const normalizeCompanyLogoUrl = (
  url: string | null | undefined
): string | undefined => {
  if (url == null) return undefined;
  const t = url.trim();
  if (!t) return undefined;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return undefined;
    return u.href;
  } catch {
    return undefined;
  }
};
