"use client";

import React, { useEffect, useState } from "react";
import { Box, List, ListItem, ListItemButton, Typography } from "@mui/material";
import type { Heading } from "@/lib/blog/markdown";

interface TableOfContentsProps {
  headings: Heading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeSlug, setActiveSlug] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSlug(entry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: "-88px 0px -60% 0px",
        threshold: 0,
      }
    );

    headings.forEach(({ slug }) => {
      const el = document.getElementById(slug);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <Box
      component="nav"
      aria-label="Cuprins articol"
      sx={{
        position: { md: "sticky" },
        top: { md: 88 },
        maxHeight: { md: "calc(100vh - 120px)" },
        overflowY: "auto",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 2,
        bgcolor: "background.paper",
        mb: { xs: 3, md: 0 },
      }}
    >
      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: "block", textTransform: "uppercase", letterSpacing: 0.5 }}>
        Cuprins
      </Typography>
      <List disablePadding dense>
        {headings.map(({ slug, text, depth }) => {
          const isActive = activeSlug === slug;
          return (
            <ListItem key={slug} disablePadding>
              <ListItemButton
                component="a"
                href={`#${slug}`}
                sx={{
                  pl: depth === 3 ? 2.5 : 1,
                  py: 0.5,
                  borderRadius: 1,
                  color: isActive ? "primary.main" : "text.secondary",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: "0.8125rem",
                  lineHeight: 1.5,
                  borderLeft: isActive ? "2px solid" : "2px solid transparent",
                  borderColor: isActive ? "primary.main" : "transparent",
                  "&:hover": { color: "primary.main", bgcolor: "action.hover" },
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
