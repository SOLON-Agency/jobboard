"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import { BlogCard } from "@/components/blog/BlogCard";
import type { BlogPostWithAuthor } from "@/services/blog.service";

interface BlogPreviewCarouselProps {
  posts: BlogPostWithAuthor[];
}

const SCROLL_THRESHOLD = 4;

export function BlogPreviewCarousel({ posts }: BlogPreviewCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollPrev(scrollLeft > SCROLL_THRESHOLD);
    setCanScrollNext(scrollLeft + clientWidth < scrollWidth - SCROLL_THRESHOLD);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    updateScrollState();

    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        updateScrollState();
        rafId = 0;
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateScrollState);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [updateScrollState, posts.length]);

  const scrollByOneCard = useCallback((direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>("[data-blog-slide]");
    const cardWidth = firstCard?.offsetWidth ?? el.clientWidth * 0.85;
    const gap = 24;
    el.scrollBy({ left: direction * (cardWidth + gap), behavior: "smooth" });
  }, []);

  return (
    <Box>
      {/* Controls (top-right) — hidden on mobile where touch scroll feels natural */}
      <Stack
        direction="row"
        spacing={1}
        justifyContent="flex-end"
        sx={{ mb: 3, display: { xs: "none", sm: "flex" } }}
      >
        <IconButton
          onClick={() => scrollByOneCard(-1)}
          disabled={!canScrollPrev}
          aria-label="Articolul anterior"
          size="medium"
          sx={{
            border: "1px solid rgba(3, 23, 12, 0.12)",
            borderRadius: 99,
            width: 44,
            height: 44,
            color: canScrollPrev ? "text.primary" : "text.disabled",
            transition: "all 0.2s",
            "&:hover:not(:disabled)": {
              borderColor: "primary.main",
              bgcolor: "rgba(195,174,97,0.08)",
            },
          }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <IconButton
          onClick={() => scrollByOneCard(1)}
          disabled={!canScrollNext}
          aria-label="Articolul următor"
          size="medium"
          sx={{
            border: "1px solid rgba(3, 23, 12, 0.12)",
            borderRadius: 99,
            width: 44,
            height: 44,
            color: canScrollNext ? "text.primary" : "text.disabled",
            transition: "all 0.2s",
            "&:hover:not(:disabled)": {
              borderColor: "primary.main",
              bgcolor: "rgba(195,174,97,0.08)",
            },
          }}
        >
          <ArrowForwardIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* Scrollable track */}
      <Box
        ref={trackRef}
        role="region"
        aria-label="Articole recente din blog"
        sx={{
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: {
            xs: "88%",
            sm: "calc((100% - 24px) / 2)",
            md: "calc((100% - 48px) / 3)",
          },
          gap: 3,
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          scrollPaddingLeft: { xs: 0, md: 0 },
          pb: 1,
          // Soft fade edge so cards don't appear clipped
          maskImage: {
            xs: "none",
            md: "linear-gradient(90deg, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)",
          },
          WebkitMaskImage: {
            xs: "none",
            md: "linear-gradient(90deg, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)",
          },
          "&::-webkit-scrollbar": { display: "none" },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
          scrollBehavior: "smooth",
        }}
      >
        {posts.map((post, idx) => (
          <Box
            key={post.id}
            data-blog-slide
            sx={{
              scrollSnapAlign: "start",
              minWidth: 0,
              display: "flex",
            }}
          >
            <BlogCard post={post} priority={idx === 0} />
          </Box>
        ))}
      </Box>

      {/* CTA */}
      <Box sx={{ textAlign: "center", mt: { xs: 4, md: 6 } }}>
        <Button
          component={Link}
          href="/blog"
          variant="outlined"
          size="large"
          endIcon={<ArrowRightAltIcon />}
          sx={{
            px: 4,
            py: 1.4,
            borderRadius: 99,
            fontWeight: 600,
            borderColor: "rgba(3,23,12,0.25)",
            color: "text.primary",
            "&:hover": {
              borderColor: "primary.main",
              bgcolor: "rgba(195,174,97,0.06)",
            },
          }}
        >
          Vezi toate articolele
        </Button>
      </Box>
    </Box>
  );
}
