"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Box,
  Typography,
  Chip,
  Stack,
  Button,
  Avatar,
  IconButton,
  Paper,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import type { Tables } from "@/types/database";
import { formatSalary, jobTypeLabels, jobTypeChipSx } from "@/lib/utils";
import { ApplyButton } from "@/components/jobs/ApplyButton";

type JobWithCompany = Tables<"job_listings"> & { companies: Tables<"companies"> | null };

const VISIBLE = 3; // cards visible at once on desktop

interface Props {
  title?: string;
  subtitle?: string;
  description?: string;
  jobs: JobWithCompany[];
}

export const JobsCarousel: React.FC<Props> = ({ title, subtitle, description, jobs }) => {
  const [start, setStart] = useState(0);

  if (jobs.length === 0) return null;

  const canPrev = start > 0;
  const canNext = start + VISIBLE < jobs.length;
  const visible = jobs.slice(start, start + VISIBLE);

  return (
    <Box sx={{ py: { xs: 3, md: 2 } }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        {title && <Typography variant="h2" fontWeight={700} sx={{ mb: 1 }}>
          {title}
        </Typography>}
        {subtitle && (
          <Typography variant="h3" fontWeight={700} sx={{ mb: 1 }}>
            {subtitle}
          </Typography>
        )}
        {description && (
          <Typography variant="body1" color="text.secondary">
            {description}
          </Typography>
        )}
        <Stack direction="row" spacing={1}>
          <IconButton
            onClick={() => setStart((s) => Math.max(0, s - 1))}
            disabled={!canPrev}
            size="small"
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
            onClick={() => setStart((s) => Math.min(jobs.length - VISIBLE, s + 1))}
            disabled={!canNext}
            size="small"
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

      {/* Cards grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
          gap: 2.5,
        }}
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
              transition: "border-color 0.2s, box-shadow 0.2s",
              "&:hover": {
                borderColor: "primary.main",
                boxShadow: (t) => `0 4px 16px ${t.palette.primary.main}18`,
              },
            }}
          >
            {/* Logo row */}
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

            {/* Badge + title */}
            <Box>
              {job.job_type && (
                <Chip
                  label={jobTypeLabels[job.job_type] ?? job.job_type}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: "0.68rem", height: 20, mb: 1, ...jobTypeChipSx[job.job_type] }}
                />
              )}
              <Typography
                component={Link}
                href={`/jobs/${job.slug}`}
                variant="subtitle1"
                fontWeight={700}
                sx={{
                  display: "block",
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

            {/* Salary */}
            <Typography variant="body2" color="text.secondary">
              {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
            </Typography>

            {/* Location + Apply */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: "auto" }}>
              {job.location ? (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <LocationOnOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {job.location}
                  </Typography>
                </Stack>
              ) : (
                <Box />
              )}
              <ApplyButton job={job} size="small" sx={{ px: 2, fontSize: "0.72rem" }} />
            </Stack>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};
