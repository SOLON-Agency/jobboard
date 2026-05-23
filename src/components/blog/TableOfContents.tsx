"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { alpha, Box, List, ListItem, ListItemButton, Typography, useMediaQuery, useTheme } from "@mui/material";
import type { Heading } from "@/lib/blog/markdown";

/** Aligns with MarkdownRenderer heading `scrollMarginTop` + sticky navbar clearance */
const SCROLL_FOCUS_LINE_PX = 96;

interface TableOfContentsProps {
  headings: Heading[];
  variant?: "inline" | "sidebar";
}

export function TableOfContents({ headings, variant = "inline" }: TableOfContentsProps) {
  const theme = useTheme();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", {
    defaultMatches: false,
  });
  const [activeSlug, setActiveSlug] = useState<string>("");
  const rafRef = useRef<number | null>(null);

  const updateActiveSlug = useCallback(() => {
    if (headings.length === 0) return;

    let slug = "";
    for (let i = headings.length - 1; i >= 0; i--) {
      const el = document.getElementById(headings[i].slug);
      if (!el) continue;
      const { top } = el.getBoundingClientRect();
      if (top <= SCROLL_FOCUS_LINE_PX) {
        slug = headings[i].slug;
        break;
      }
    }

    setActiveSlug((prev) => (prev === slug ? prev : slug));
  }, [headings]);

  useEffect(() => {
    if (headings.length === 0) return;

    const onScrollOrResize = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        updateActiveSlug();
      });
    };

    const initialRaf = requestAnimationFrame(() => {
      updateActiveSlug();
    });

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });

    return () => {
      cancelAnimationFrame(initialRaf);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [headings, updateActiveSlug]);

  if (headings.length < 2) return null;

  const isSidebar = variant === "sidebar";
  const transition =
    reducedMotion
      ? "none"
      : "background-color 160ms ease, border-color 160ms ease, color 160ms ease";

  return (
    <Box
      component="nav"
      aria-label="Cuprins articol"
      sx={{
        alignSelf: isSidebar ? "flex-start" : undefined,
        width: isSidebar ? "100%" : undefined,
        position: isSidebar ? "sticky" : "relative",
        top: isSidebar ? SCROLL_FOCUS_LINE_PX : undefined,
        maxHeight: isSidebar ? `calc(100vh - ${SCROLL_FOCUS_LINE_PX + 24}px)` : undefined,
        overflowY: isSidebar ? "auto" : undefined,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 2,
        bgcolor: "background.paper",
        mb: { xs: 3, lg: isSidebar ? 0 : 3 },
      }}
    >
      <Typography
        variant="caption"
        fontWeight={700}
        color="text.secondary"
        sx={{ mb: 1, display: "block", textTransform: "uppercase", letterSpacing: 0.5 }}
      >
        Cuprins
      </Typography>
      <List disablePadding dense>
        {headings.map(({ slug, text, depth }) => {
          const isActive = activeSlug !== "" && activeSlug === slug;
          return (
            <ListItem key={slug} disablePadding>
              <ListItemButton
                component="a"
                href={`#${slug}`}
                aria-current={isActive ? "location" : undefined}
                sx={{
                  pl: depth === 3 ? 2.5 : 1,
                  py: 0.75,
                  borderRadius: 1,
                  fontSize: "0.8125rem",
                  lineHeight: 1.5,
                  borderLeft: "3px solid",
                  borderColor: isActive
                    ? alpha(theme.palette.primary.main, 0.55)
                    : "transparent",
                  bgcolor: isActive ? alpha(theme.palette.primary.main, 0.07) : "transparent",
                  color: isActive ? "text.primary" : "text.secondary",
                  fontWeight: isActive ? 600 : 400,
                  transition,
                  "&:hover": {
                    bgcolor: isActive
                      ? alpha(theme.palette.primary.main, 0.1)
                      : "action.hover",
                    color: "text.primary",
                  },
                  "&:focus-visible": {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: 2,
                  },
                }}
              >
                {text}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
