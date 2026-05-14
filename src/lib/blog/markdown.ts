/**
 * Pure markdown utilities — no browser APIs, no React imports.
 * Safe to call in both Server Components and client code.
 */

/**
 * Converts a string into a URL-safe slug.
 * Strips diacritics, lowercases, replaces non-alphanumeric runs with dashes,
 * and trims leading/trailing dashes.
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/**
 * Estimates reading time in whole minutes (minimum 1).
 * Counts words by splitting on whitespace; uses a configurable WPM.
 */
export function readingTimeMinutes(markdown: string, wpm = 220): number {
  const wordCount = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wpm));
}

/**
 * Strips basic markdown syntax and returns a plain-text excerpt.
 * Truncates at a word boundary near `maxChars` and appends "…".
 */
export function autoExcerpt(markdown: string, maxChars = 200): string {
  const plain = markdown
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/[*_~`>]+/g, "")
    .replace(/\n+/g, " ")
    .trim();

  if (plain.length <= maxChars) return plain;

  const truncated = plain.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > maxChars * 0.7 ? truncated.slice(0, lastSpace) : truncated) + "…";
}

export interface Heading {
  depth: number;
  text: string;
  slug: string;
}

/**
 * Extracts headings (h2/h3) from a markdown string for table-of-contents use.
 * Skips h1 (used only for the post title) and h4+ (too deep for TOC).
 */
export function extractHeadings(markdown: string): Heading[] {
  const headingRe = /^(#{2,3})\s+(.+)$/gm;
  const headings: Heading[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRe.exec(markdown)) !== null) {
    const depth = match[1].length;
    const text = match[2].replace(/[*_`]/g, "").trim();
    headings.push({ depth, text, slug: slugify(text) });
  }

  return headings;
}

/**
 * Formats a date string or Date object to a human-readable Romanian date.
 * Example: "14 mai 2026"
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Escapes characters that would break an XML/RSS document.
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
