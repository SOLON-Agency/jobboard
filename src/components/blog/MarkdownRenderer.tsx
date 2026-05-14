"use client";

import ReactMarkdown from "react-markdown";
import Image from "next/image";
import { Box } from "@mui/material";
import { slugify } from "@/lib/blog/markdown";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  markdown: string;
}

/**
 * Renders markdown safely with react-markdown.
 * - `skipHtml` and a strict allowedElements list prevent XSS.
 * - External links get rel="noopener noreferrer nofollow" and open in a new tab.
 * - Images use next/image for optimisation.
 * - h2/h3 elements receive id attributes derived from their text for TOC anchoring.
 */
export function MarkdownRenderer({ markdown }: MarkdownRendererProps) {
  const components: Components = {
    // Headings with anchor IDs for table-of-contents linking
    h2({ children, ...props }) {
      const text = String(children);
      return (
        <h2 id={slugify(text)} {...props}>
          {children}
        </h2>
      );
    },
    h3({ children, ...props }) {
      const text = String(children);
      return (
        <h3 id={slugify(text)} {...props}>
          {children}
        </h3>
      );
    },
    // Safe external links
    a({ href, children, ...props }) {
      const isExternal = href?.startsWith("http");
      return (
        <a
          href={href}
          rel="noopener noreferrer nofollow"
          target={isExternal ? "_blank" : undefined}
          {...props}
        >
          {children}
          {isExternal && (
            <span className="sr-only"> (se deschide în tab nou)</span>
          )}
        </a>
      );
    },
    // Optimised images via next/image
    img({ src, alt }) {
      if (!src || typeof src !== "string") return null;
      return (
        <span style={{ display: "block", position: "relative" }}>
          <Image
            src={src}
            alt={alt ?? ""}
            width={800}
            height={450}
            sizes="(max-width: 768px) 100vw, 800px"
            style={{ maxWidth: "100%", height: "auto", borderRadius: 8 }}
          />
        </span>
      );
    },
  };

  return (
    <Box
      sx={{
        // Prose-style typography within the markdown body
        "& h2": {
          mt: 4,
          mb: 1.5,
          fontSize: { xs: "1.35rem", md: "1.5rem" },
          fontWeight: 700,
          lineHeight: 1.3,
          scrollMarginTop: "96px",
        },
        "& h3": {
          mt: 3,
          mb: 1,
          fontSize: { xs: "1.1rem", md: "1.25rem" },
          fontWeight: 600,
          lineHeight: 1.4,
          scrollMarginTop: "96px",
        },
        "& p": { mb: 2, lineHeight: 1.8 },
        "& ul, & ol": { pl: 3, mb: 2 },
        "& li": { mb: 0.5, lineHeight: 1.7 },
        "& blockquote": {
          borderLeft: "4px solid",
          borderColor: "primary.main",
          pl: 2,
          ml: 0,
          my: 2,
          color: "text.secondary",
          fontStyle: "italic",
        },
        "& code": {
          bgcolor: "action.hover",
          borderRadius: 0.5,
          px: 0.5,
          py: 0.25,
          fontFamily: "monospace",
          fontSize: "0.875em",
        },
        "& pre": {
          bgcolor: "grey.900",
          color: "grey.100",
          p: 2,
          borderRadius: 2,
          overflowX: "auto",
          mb: 2,
          "& code": {
            bgcolor: "transparent",
            p: 0,
            color: "inherit",
          },
        },
        "& hr": { borderColor: "divider", my: 3 },
        "& a": {
          color: "primary.main",
          textDecoration: "underline",
          textUnderlineOffset: "2px",
          "&:hover": { opacity: 0.8 },
        },
        "& strong": { fontWeight: 700 },
        "& em": { fontStyle: "italic" },
        "& img": { maxWidth: "100%", borderRadius: 2, my: 2 },
        "& table": {
          width: "100%",
          borderCollapse: "collapse",
          mb: 2,
          "& th, & td": {
            border: "1px solid",
            borderColor: "divider",
            p: 1,
            textAlign: "left",
          },
          "& th": { bgcolor: "action.hover", fontWeight: 700 },
        },
      }}
    >
      <ReactMarkdown
        skipHtml
        allowedElements={[
          "h2", "h3", "h4",
          "p", "a", "ul", "ol", "li",
          "strong", "em", "del",
          "blockquote", "code", "pre",
          "hr", "img", "table", "thead", "tbody", "tr", "th", "td",
        ]}
        unwrapDisallowed
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </Box>
  );
}
