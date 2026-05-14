import { describe, it, expect } from "vitest";
import {
  slugify,
  readingTimeMinutes,
  autoExcerpt,
  extractHeadings,
  formatDate,
  escapeXml,
} from "@/lib/blog/markdown";

describe("slugify", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips diacritics", () => {
    expect(slugify("Articol juridic în România")).toBe("articol-juridic-in-romania");
  });

  it("collapses multiple non-alphanumeric chars into a single dash", () => {
    expect(slugify("title!! --test")).toBe("title-test");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("  ---hello---  ")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("truncates at 120 characters", () => {
    const long = "a".repeat(200);
    expect(slugify(long).length).toBeLessThanOrEqual(120);
  });
});

describe("readingTimeMinutes", () => {
  it("returns 1 for very short content", () => {
    expect(readingTimeMinutes("hello world")).toBe(1);
  });

  it("calculates based on word count / wpm", () => {
    // 440 words at 220 wpm = 2 min
    const text = Array(440).fill("word").join(" ");
    expect(readingTimeMinutes(text)).toBe(2);
  });

  it("rounds up", () => {
    // 221 words at 220 wpm → ceil(1.004) = 2
    const text = Array(221).fill("w").join(" ");
    expect(readingTimeMinutes(text)).toBe(2);
  });
});

describe("autoExcerpt", () => {
  it("returns full text when shorter than maxChars", () => {
    expect(autoExcerpt("Short text.")).toBe("Short text.");
  });

  it("strips markdown syntax", () => {
    const md = "## Heading\n\nParagraph with **bold** and [link](https://example.com).";
    const result = autoExcerpt(md, 500);
    expect(result).not.toContain("##");
    expect(result).not.toContain("**");
    expect(result).not.toContain("[link]");
  });

  it("truncates at word boundary with ellipsis", () => {
    const text = Array(100).fill("word").join(" ");
    const result = autoExcerpt(text, 50);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThan(70);
  });
});

describe("extractHeadings", () => {
  const md = `
# Title (ignored)

## Section One

Some text.

### Subsection A

More text.

## Section Two
  `;

  it("returns only h2 and h3 headings", () => {
    const headings = extractHeadings(md);
    expect(headings.map((h) => h.text)).toEqual([
      "Section One",
      "Subsection A",
      "Section Two",
    ]);
  });

  it("assigns correct depth", () => {
    const headings = extractHeadings(md);
    expect(headings[0].depth).toBe(2);
    expect(headings[1].depth).toBe(3);
  });

  it("generates slugs from heading text", () => {
    const headings = extractHeadings(md);
    expect(headings[0].slug).toBe("section-one");
  });

  it("returns empty array for text with no headings", () => {
    expect(extractHeadings("Just a paragraph.")).toHaveLength(0);
  });
});

describe("escapeXml", () => {
  it("escapes ampersand", () => {
    expect(escapeXml("foo & bar")).toBe("foo &amp; bar");
  });

  it("escapes angle brackets", () => {
    expect(escapeXml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes quotes", () => {
    expect(escapeXml('"hello"')).toBe("&quot;hello&quot;");
  });
});

describe("formatDate", () => {
  it("returns a Romanian date string", () => {
    const result = formatDate("2026-05-14");
    expect(result).toContain("2026");
    expect(result).toContain("mai");
  });
});
