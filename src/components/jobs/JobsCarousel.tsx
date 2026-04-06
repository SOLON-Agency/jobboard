"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Box,
  Typography,
  Chip,
  Stack,
  IconButton,
  Avatar,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import type { Tables } from "@/types/database";
import { formatSalary, jobTypeLabels, jobTypeChipSx } from "@/lib/utils";
import { ApplyButton } from "@/components/jobs/ApplyButton";

type JobWithCompany = Tables<"job_listings"> & { companies: Tables<"companies"> | null };

const AUTO_MS = 5500;
const SWIPE_MIN_PX = 48;

/** Overlapping slide: incoming above outgoing; full-width horizontal travel. */
const slideVariantsFull: Variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "100%" : "-100%",
    zIndex: 2,
  }),
  center: {
    x: 0,
    zIndex: 2,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-100%" : "100%",
    zIndex: 1,
  }),
};

const slideVariantsReduced: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

const carouselTransition = {
  type: "tween" as const,
  duration: 0.45,
  ease: [0.22, 0.61, 0.36, 1] as [number, number, number, number],
};

const carouselTransitionReduced = {
  type: "tween" as const,
  duration: 0.18,
  ease: "easeOut" as const,
};

interface Props {
  title?: string;
  subtitle?: string;
  description?: string;
  jobs: JobWithCompany[];
  autoScroll?: boolean;
}

export const JobsCarousel: React.FC<Props> = ({ title, subtitle, description, jobs, autoScroll = false }) => {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const isLgUp = useMediaQuery(theme.breakpoints.up("lg"));
  const isXlUp = useMediaQuery(theme.breakpoints.up("xl"));
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const isBelowLg = useMediaQuery(theme.breakpoints.down("lg"));

  const perView = isXlUp ? 4 : isLgUp ? 3 : 2;

  const [start, setStart] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const [viewportH, setViewportH] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const numPositionsRef = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  const numPositions = Math.max(1, jobs.length - perView + 1);
  numPositionsRef.current = numPositions;
  const canPrev = start > 0;
  const canNext = start < numPositions - 1;
  const visible = useMemo(() => jobs.slice(start, start + perView), [jobs, start, perView]);

  const goPrev = () => {
    setDirection(-1);
    setStart((s) => Math.max(0, s - 1));
  };

  const goNext = () => {
    setDirection(1);
    setStart((s) => Math.min(numPositions - 1, s + 1));
  };

  const gridStyle = useMemo(
    () => ({
      display: "grid" as const,
      gap: theme.spacing(2.5),
      gridTemplateColumns: isXlUp
        ? "repeat(4, minmax(0, 1fr))"
        : isLgUp
          ? "repeat(3, minmax(0, 1fr))"
          : isMdUp
            ? "repeat(2, minmax(0, 1fr))"
            : "minmax(0, 1fr)",
      width: "100%" as const,
    }),
    [theme, isLgUp, isXlUp, isMdUp]
  );

  /** Keep viewport tall enough for overlapping absolute tracks (sync mode). */
  useLayoutEffect(() => {
    if (reduceMotion) return;
    const root = viewportRef.current;
    if (!root) return;

    const measure = () => {
      const tracks = root.querySelectorAll<HTMLElement>("[data-carousel-track]");
      let max = 0;
      tracks.forEach((el) => {
        max = Math.max(max, el.getBoundingClientRect().height);
      });
      if (max > 0) {
        setViewportH((prev) => (Math.abs((prev ?? 0) - max) > 1 ? Math.ceil(max) : prev));
      }
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    root.querySelectorAll("[data-carousel-track]").forEach((el) => ro.observe(el));

    const mo = new MutationObserver(() => {
      measure();
      root.querySelectorAll("[data-carousel-track]").forEach((el) => ro.observe(el));
    });
    mo.observe(root, { childList: true, subtree: true });

    const raf = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
    };
  }, [reduceMotion, start, visible, gridStyle]);

  useEffect(() => {
    setStart((s) => Math.min(s, Math.max(0, numPositions - 1)));
  }, [numPositions, jobs.length]);

  useEffect(() => {
    if (!autoScroll) return;
    if (jobs.length <= perView || paused) return;
    const np = Math.max(1, jobs.length - perView + 1);
    if (np <= 1) return;
    const id = window.setInterval(() => {
      setDirection(1);
      setStart((s) => (s >= np - 1 ? 0 : s + 1));
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [jobs.length, perView, paused]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (!isBelowLg) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!isBelowLg || touchStartX.current === null) return;
    const x = e.changedTouches[0].clientX;
    const dx = x - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < SWIPE_MIN_PX) return;
    const np = numPositionsRef.current;
    if (dx > 0) {
      setDirection(-1);
      setStart((s) => Math.max(0, s - 1));
    } else {
      setDirection(1);
      setStart((s) => Math.min(np - 1, s + 1));
    }
  };

  if (jobs.length === 0) return null;

  const slideVariants = reduceMotion ? slideVariantsReduced : slideVariantsFull;
  const transition = reduceMotion ? carouselTransitionReduced : carouselTransition;
  const overlapMode = !reduceMotion;

  const slideMotionStyle: React.CSSProperties = {
    ...gridStyle,
    willChange: reduceMotion ? undefined : "transform",
    ...(overlapMode
      ? {
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          pointerEvents: "auto" as const,
        }
      : {}),
  };

  return (
    <Box
      sx={{ py: { xs: 3, md: 2 } }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Header */}
      <Stack spacing={1} sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            {title && (
              <Typography variant="h2" fontWeight={700} sx={{ mb: subtitle ? 0.5 : 0 }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="h3" fontWeight={700}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <IconButton
              onClick={goPrev}
              disabled={!canPrev}
              size="small"
              aria-label="Anterior"
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                color: canPrev ? "text.primary" : "text.disabled",
              }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={goNext}
              disabled={!canNext}
              size="small"
              aria-label="Următor"
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                color: canNext ? "text.primary" : "text.disabled",
              }}
            >
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
        {description && (
          <Typography variant="body1" color="text.secondary">
            {description}
          </Typography>
        )}
      </Stack>

      <Box
        ref={viewportRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        sx={{
          position: overlapMode ? "relative" : undefined,
          overflow: "hidden",
          width: "100%",
          touchAction: isBelowLg ? "pan-y" : undefined,
          ...(overlapMode && {
            minHeight: viewportH != null ? `${viewportH}px` : { xs: 260, md: 300 },
          }),
        }}
      >
        <AnimatePresence initial={false} custom={direction} mode={overlapMode ? "sync" : "wait"}>
          <motion.div
            key={start}
            data-carousel-track
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            style={slideMotionStyle}
          >
            {visible.map((job) => (
              <Paper
                key={job.id}
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  minWidth: 0,
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: (t) => `0 4px 16px ${t.palette.primary.main}18`,
                  },
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Avatar
                    src={job.companies?.logo_url ?? undefined}
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: "background.default",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                    }}
                  >
                    <WorkOutlineIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                  </Avatar>
                </Stack>

                <Box>
                  {job.job_type && (
                    <Chip
                      label={jobTypeLabels[job.job_type] ?? job.job_type}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.68rem",
                        height: 20,
                        mb: 1,
                        ...jobTypeChipSx[job.job_type],
                      }}
                    />
                  )}
                  <Typography
                    component={Link}
                    href={`/jobs/${job.slug}`}
                    variant="subtitle1"
                    fontWeight={700}
                    sx={{
                      display: "-webkit-box",
                      textDecoration: "none",
                      color: "text.primary",
                      lineHeight: 1.35,
                      overflow: "hidden",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      "&:hover": { color: "primary.main" },
                    }}
                  >
                    {job.title}
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary">
                  {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                </Typography>

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: "auto" }}>
                  {job.location ? (
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                      <LocationOnOutlinedIcon sx={{ fontSize: 14, color: "text.secondary", flexShrink: 0 }} />
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {job.location}
                      </Typography>
                    </Stack>
                  ) : (
                    <Box />
                  )}
                  <ApplyButton job={job} size="small" sx={{ px: 2, fontSize: "0.72rem", flexShrink: 0 }} />
                </Stack>
              </Paper>
            ))}
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
};
