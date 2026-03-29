"use client";

import React, { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  Box,
  Typography,
  Chip,
  Stack,
  Button,
  Avatar,
  Paper,
  Divider,
  IconButton,
  Snackbar,
  Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import type { Tables } from "@/types/database";
import {
  formatSalary,
  formatDate,
  jobTypeLabels,
  experienceLevelLabels,
} from "@/lib/utils";
import appSettings from "@/config/app.settings.json";

type JobWithCompany = Tables<"job_listings"> & {
  companies: Tables<"companies"> | null;
};

interface JobDetailProps {
  job: JobWithCompany;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

/** Split TipTap HTML by <h2> headings into titled sections. Falls back to a single "Overview" section. */
function parseSections(html: string): Array<{ title: string; html: string }> {
  const h2Re = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  const headings = [...html.matchAll(h2Re)].map((m) =>
    m[1].replace(/<[^>]*>/g, "").trim()
  );

  if (headings.length === 0) return [{ title: "Overview", html }];

  const parts = html.split(/<h2[^>]*>[\s\S]*?<\/h2>/gi);
  return headings
    .map((title, i) => ({ title, html: (parts[i + 1] ?? "").trim() }))
    .filter((s) => s.html.length > 0);
}

const MetaItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={700}>
      {value}
    </Typography>
  </Box>
);

export const JobDetail: React.FC<JobDetailProps> = ({
  job,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setSnackMsg("Link copiat în clipboard");
    setSnackOpen(true);
  };

  const shareUrl = encodeURIComponent(
    typeof window !== "undefined" ? window.location.href : ""
  );
  const shareTitle = encodeURIComponent(job.title);

  const isHtml = job.description?.trimStart().startsWith("<");
  const sections = isHtml ? parseSections(job.description ?? "") : null;

  const applyButton = job.application_url ? (
    <Button
      variant="contained"
      size="large"
      href={job.application_url}
      target="_blank"
      rel="noopener noreferrer"
      endIcon={<OpenInNewIcon />}
      fullWidth
      sx={{ borderRadius: 5, py: 1.5, fontWeight: 700, fontSize: "1rem" }}
    >
      Aplică acum
    </Button>
  ) : (
    <Button
      variant="contained"
      size="large"
      component={Link}
      href={`/jobs/${job.slug}#apply`}
      fullWidth
      sx={{ borderRadius: 5, py: 1.5, fontWeight: 700, fontSize: "1rem" }}
    >
      Aplică acum
    </Button>
  );

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1fr 300px" },
        gap: { xs: 3, lg: 4 },
        alignItems: "start",
      }}
    >
      {/* ── LEFT: main content ── */}
      <Box>
        {/* Date + company byline */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <CalendarTodayOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
          <Typography variant="caption" color="text.secondary">
            {job.published_at ? formatDate(job.published_at) : "Ciornă"}
            {job.companies && (
              <>
                {" "}de{" "}
                <Typography
                  component={Link}
                  href={`/companies/${job.companies.slug}`}
                  variant="caption"
                  fontWeight={700}
                  sx={{ color: "text.primary", textDecoration: "none", "&:hover": { color: "primary.main" } }}
                >
                  {job.companies.name}
                </Typography>
              </>
            )}
          </Typography>
        </Stack>

        {/* Title */}
        <Typography variant="h2" sx={{ mb: 2, lineHeight: 1.2 }}>
          {job.title}
        </Typography>

        {/* Share + bookmark row */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            size="small"
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ borderRadius: 5, fontSize: "0.75rem" }}
          >
            Facebook
          </Button>
          <Button
            variant="outlined"
            size="small"
            href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ borderRadius: 5, fontSize: "0.75rem" }}
          >
            Twitter / X
          </Button>
          <Tooltip title="Copiază link">
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopyIcon sx={{ fontSize: "14px !important" }} />}
              onClick={copyLink}
              sx={{ borderRadius: 5, fontSize: "0.75rem" }}
            >
              Copiază
            </Button>
          </Tooltip>
          {appSettings.features.favouriteJobs && onToggleFavorite && (
            <IconButton
              onClick={onToggleFavorite}
              size="small"
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 5,
                px: 1.5,
                color: isFavorite ? "primary.main" : "text.secondary",
              }}
            >
              {isFavorite ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
            </IconButton>
          )}
        </Stack>

        {/* Job description — numbered sections */}
        <Stack spacing={2}>
          {isHtml && sections ? (
            sections.map((section, idx) => (
              <Paper
                key={section.title}
                variant="outlined"
                sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 2 }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </Box>
                  <Typography variant="h5" fontWeight={700}>
                    {section.title}
                  </Typography>
                </Stack>
                <Box
                  dangerouslySetInnerHTML={{ __html: section.html }}
                  sx={{
                    "& p": { mb: 1.5, lineHeight: 1.75, color: "text.secondary" },
                    "& ul, & ol": { pl: 3, mb: 1.5, color: "text.secondary" },
                    "& li": { mb: 0.5 },
                    "& strong": { color: "text.primary", fontWeight: 700 },
                    "& a": { color: "primary.main" },
                    "& h3": { mt: 2, mb: 1, fontWeight: 700 },
                    "& code": {
                      bgcolor: "action.hover",
                      borderRadius: 0.5,
                      px: 0.5,
                      fontFamily: "monospace",
                      fontSize: "0.85em",
                    },
                  }}
                />
              </Paper>
            ))
          ) : (
            <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    flexShrink: 0,
                  }}
                >
                  1
                </Box>
                <Typography variant="h5" fontWeight={700}>Prezentare generală</Typography>
              </Stack>
              <Box
                sx={{
                  "& h1, & h2, & h3": { mt: 2, mb: 1, fontWeight: 700 },
                  "& p": { mb: 1.5, lineHeight: 1.75, color: "text.secondary" },
                  "& ul, & ol": { pl: 3, mb: 1.5, color: "text.secondary" },
                  "& li": { mb: 0.5 },
                  "& a": { color: "primary.main" },
                }}
              >
                <ReactMarkdown>{job.description ?? ""}</ReactMarkdown>
              </Box>
            </Paper>
          )}
        </Stack>

        {/* Mobile Apply button */}
        <Box sx={{ mt: 3, display: { xs: "block", lg: "none" } }}>
          {applyButton}
        </Box>
      </Box>

      {/* ── RIGHT: sticky company sidebar ── */}
      <Box sx={{ position: { lg: "sticky" }, top: { lg: 88 } }}>
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: "background.paper",
          }}
        >
          {/* Company hero */}
          <Box
            sx={{
              bgcolor: "action.hover",
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Avatar
              src={job.companies?.logo_url ?? undefined}
              sx={{
                width: 64,
                height: 64,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                mb: 1.5,
              }}
            >
              <WorkOutlineIcon sx={{ fontSize: 30, color: "text.secondary" }} />
            </Avatar>
            <Typography variant="subtitle1" fontWeight={700}>
              {job.companies?.name ?? "Companie"}
            </Typography>
            {job.companies?.description && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {job.companies.description.slice(0, 80)}
                {job.companies.description.length > 80 ? "…" : ""}
              </Typography>
            )}
            {job.companies?.website && (
              <Button
                variant="contained"
                size="small"
                href={job.companies.website}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<OpenInNewIcon sx={{ fontSize: "14px !important" }} />}
                sx={{ mt: 2, borderRadius: 5, px: 3, fontWeight: 700 }}
              >
                Vizitează site-ul
              </Button>
            )}
          </Box>

          <Box sx={{ p: 2.5 }}>
            <Divider sx={{ mb: 2 }} />

            {/* Metadata grid */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
                mb: 2,
              }}
            >
              <MetaItem
                label="Salariu"
                value={formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
              />
              <MetaItem
                label="Experiență"
                value={
                  job.experience_level
                    ? (experienceLevelLabels[job.experience_level] ?? job.experience_level)
                    : "—"
                }
              />
              <MetaItem
                label="Locație"
                value={job.location ?? "—"}
              />
              <MetaItem
                label="Tip de contract"
                value={
                  job.job_type
                    ? (jobTypeLabels[job.job_type] ?? job.job_type)
                    : "—"
                }
              />
              <MetaItem
                label="Publicat"
                value={job.published_at ? formatDate(job.published_at) : "Ciornă"}
              />
              <MetaItem
                label="Remote"
                value={job.is_remote ? "Da" : "Nu"}
              />
            </Box>

            {/* Tags / chips */}
            {(job.job_type || job.experience_level || job.location) && (
              <>
                <Divider sx={{ mb: 2 }} />
                <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 2.5 }}>
                  {job.job_type && (
                    <Chip
                      label={jobTypeLabels[job.job_type] ?? job.job_type}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {job.experience_level && (
                    <Chip
                      label={experienceLevelLabels[job.experience_level] ?? job.experience_level}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {job.is_remote && (
                    <Chip label="Remote" size="small" color="primary" variant="outlined" />
                  )}

                  {job.location && (
                    <Chip
                      icon={<LocationOnOutlinedIcon />}
                      label={job.location}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Stack>
              </>
            )}

            {/* Apply button */}
            {applyButton}
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={snackOpen}
        autoHideDuration={2500}
        onClose={() => setSnackOpen(false)}
        message={snackMsg}
      />
    </Box>
  );
};
