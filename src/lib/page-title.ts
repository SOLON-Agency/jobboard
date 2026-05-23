import type { Metadata } from "next";

/**
 * Optional prefix for non-production environments (e.g. `[TEST] `).
 * Set via `NEXT_PUBLIC_TITLE_PREFIX` on Vercel Preview or by `npm run env:sync` locally.
 */
export function getPageTitlePrefix(): string {
  const raw = process.env.NEXT_PUBLIC_TITLE_PREFIX?.trim();
  return raw ? `${raw} ` : "";
}

/** Prepends the environment title prefix when configured. */
export function formatPageTitle(title: string): string {
  const prefix = getPageTitlePrefix();
  if (!prefix) return title;
  const bare = prefix.trim();
  if (title.startsWith(`${bare} `) || title.startsWith(bare)) return title;
  return `${prefix}${title}`;
}

/** Builds a Next.js `title.template` string with the optional prefix. */
export function buildTitleTemplate(brandName: string): string {
  const prefix = getPageTitlePrefix();
  return prefix ? `${prefix}%s | ${brandName}` : `%s | ${brandName}`;
}

function formatTitleTemplate(template: string): string {
  return template.includes("%s")
    ? buildTitleTemplate(extractBrandFromTemplate(template))
    : formatPageTitle(template);
}

function applyPrefixToTitleObject(
  title: Exclude<Metadata["title"], string | null | undefined>,
): Metadata["title"] {
  if ("default" in title) {
    return {
      default: formatPageTitle(title.default),
      template: formatTitleTemplate(title.template),
    };
  }

  if ("absolute" in title && "template" in title) {
    return {
      absolute: formatPageTitle(title.absolute),
      template: title.template != null ? formatTitleTemplate(title.template) : null,
    };
  }

  if ("absolute" in title) {
    return { absolute: formatPageTitle(title.absolute) };
  }

  return title;
}

/** Applies the title prefix to metadata title and social fields. */
export function withTitlePrefix(metadata: Metadata): Metadata {
  const next: Metadata = { ...metadata };

  if (typeof next.title === "string") {
    next.title = formatPageTitle(next.title);
  } else if (next.title && typeof next.title === "object") {
    next.title = applyPrefixToTitleObject(next.title);
  }

  if (next.openGraph && next.openGraph.title != null) {
    next.openGraph = {
      ...next.openGraph,
      title: formatPageTitle(String(next.openGraph.title)),
    };
  }

  if (next.twitter && next.twitter.title != null) {
    next.twitter = {
      ...next.twitter,
      title: formatPageTitle(String(next.twitter.title)),
    };
  }

  return next;
}

function extractBrandFromTemplate(template: string): string {
  const match = template.match(/%s\s*\|\s*(.+)$/);
  return match?.[1]?.trim() ?? template.replace(/^.*%s\s*\|\s*/, "");
}
