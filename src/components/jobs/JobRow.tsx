"use client";

import React from "react";
import Link from "next/link";
import {
  Paper,
  Typography,
  Chip,
  Stack,
  Box,
  Avatar,
  IconButton,
  Button,
} from "@mui/material";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import type { Tables } from "@/types/database";
import { formatSalary, timeAgo, jobTypeLabels } from "@/lib/utils";
import appSettings from "@/config/app.settings.json";

const jobTypeColors: Record<string, "success" | "warning" | "info" | "secondary" | "default"> = {
  "full-time":  "success",
  "part-time":  "warning",
  contract:     "info",
  internship:   "secondary",
  freelance:    "default",
};

interface JobRowProps {
  job: Tables<"job_listings"> & { companies: Tables<"companies"> | null };
  isFavorite?: boolean;
  onToggleFavorite?: (jobId: string) => void;
}

export const JobRow: React.FC<JobRowProps> = ({
  job,
  isFavorite = false,
  onToggleFavorite,
}) => (
  <Paper
    sx={{
      display: "flex",
      alignItems: "center",
      gap: { xs: 1.5, sm: 2 },
      px: { xs: 2, sm: 3 },
      py: 2,
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 2,
      transition: "border-color 0.2s, box-shadow 0.2s",
      "&:hover": {
        borderColor: "primary.main",
        boxShadow: (t) => `0 2px 12px ${t.palette.primary.main}18`,
      },
    }}
  >
    {/* Company logo */}
    <Avatar
      src={job.companies?.logo_url ?? undefined}
      sx={{
        width: { xs: 44, sm: 52 },
        height: { xs: 44, sm: 52 },
        flexShrink: 0,
        bgcolor: "background.default",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <WorkOutlineIcon sx={{ color: "text.secondary", fontSize: 22 }} />
    </Avatar>

    {/* Middle — type + title + company */}
    <Box
      component={Link}
      href={`/jobs/${job.slug}`}
      sx={{
        flex: 1,
        minWidth: 0,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        {job.job_type && (
          <Chip
            label={jobTypeLabels[job.job_type] ?? job.job_type}
            size="small"
            color={jobTypeColors[job.job_type] ?? "default"}
            sx={{ fontWeight: 600, fontSize: "0.68rem", height: 20 }}
          />
        )}
        {job.is_remote && (
          <Chip label="Remote" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: "0.68rem" }} />
        )}

      </Stack>
      <Typography
        variant="subtitle2"
        fontWeight={700}
        noWrap
        sx={{ lineHeight: 1.3 }}
      >
        {job.title}
      </Typography>
      <Typography variant="caption" color="text.secondary" noWrap>
        {job.companies?.name}
      </Typography>
    </Box>

    {/* Right side meta — location + salary */}
    <Box sx={{ display: { xs: "none", md: "block" }, textAlign: "right", flexShrink: 0, minWidth: 140 }}>
      {job.location && (
        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
          <LocationOnOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
          <Typography variant="caption" color="text.secondary" noWrap>
            {job.location}
          </Typography>
        </Stack>
      )}
      <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700, display: "block" }}>
        {formatSalary(job.salary_min, job.salary_max)}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {job.published_at ? timeAgo(job.published_at) : "Ciornă"}
      </Typography>
    </Box>

    {/* Actions */}
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
      {appSettings.features.favouriteJobs && onToggleFavorite && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite(job.id);
          }}
          sx={{ color: isFavorite ? "primary.main" : "text.secondary" }}
          title={isFavorite ? "Elimină din favorite" : "Salvează"}
        >
          {isFavorite
            ? <BookmarkIcon fontSize="small" />
            : <BookmarkBorderIcon fontSize="small" />
          }
        </IconButton>
      )}
      <Button
        component={Link}
        href={`/jobs/${job.slug}`}
        variant="contained"
        size="small"
        sx={{
          borderRadius: 5,
          px: 2.5,
          py: 0.75,
          fontWeight: 700,
          fontSize: "0.75rem",
          whiteSpace: "nowrap",
          display: { xs: "none", sm: "inline-flex" },
        }}
      >
        Aplică
      </Button>
    </Stack>
  </Paper>
);
