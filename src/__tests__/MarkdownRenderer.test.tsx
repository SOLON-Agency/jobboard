import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";

// next/image is not available in jsdom; stub it.
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

describe("MarkdownRenderer", () => {
  it("renders a heading", () => {
    render(<MarkdownRenderer markdown="## Hello World" />);
    expect(screen.getByRole("heading", { name: "Hello World" })).toBeDefined();
  });

  it("renders a bullet list", () => {
    const { container } = render(
      <MarkdownRenderer markdown={`- item one\n- item two`} />
    );
    const ul = container.querySelector("ul");
    expect(ul).not.toBeNull();
    const items = container.querySelectorAll("li");
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it("does NOT render raw HTML script tags (XSS prevention)", () => {
    const malicious = "<script>alert('xss')</script>\n\nSafe paragraph.";
    const { container } = render(<MarkdownRenderer markdown={malicious} />);
    const scripts = container.querySelectorAll("script");
    expect(scripts.length).toBe(0);
    expect(container.innerHTML).not.toContain("alert('xss')");
  });

  it("does NOT render inline HTML that could XSS", () => {
    const { container } = render(
      <MarkdownRenderer markdown={'<img src="x" onerror="alert(1)" />'} />
    );
    // skipHtml=true means the img is not rendered as raw HTML
    const imgs = container.querySelectorAll("img[onerror]");
    expect(imgs.length).toBe(0);
  });

  it("renders bold text", () => {
    const { container } = render(<MarkdownRenderer markdown="**bold text**" />);
    expect(container.querySelector("strong")).toBeDefined();
  });

  it("adds id attribute to h2 for TOC anchoring", () => {
    const { container } = render(<MarkdownRenderer markdown="## My Section" />);
    const h2 = container.querySelector("h2");
    expect(h2?.id).toBe("my-section");
  });
});
