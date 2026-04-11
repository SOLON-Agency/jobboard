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
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import type { Tables } from "@/types/database";
import {
  formatSalary,
  timeAgo,
  jobTypeLabels,
  jobTypeChipSx,
  experienceLevelLabels,
} from "@/lib/utils";
import { ApplyButton } from "@/components/jobs/ApplyButton";
import appSettings from "@/config/app.settings.json";

const statusColor: Record<string, "default" | "success" | "warning"> = {
  draft: "warning",
  published: "success",
  archived: "default",
};

interface JobRowProps {
  job: Tables<"job_listings"> & { companies: Tables<"companies"> | null };
  isFavorite?: boolean;
  onToggleFavorite?: (jobId: string) => void;
  showStatus?: boolean;
  actions?: React.ReactNode;
}

export const JobRow: React.FC<JobRowProps> = ({
  job,
  isFavorite = false,
  onToggleFavorite,
  showStatus = false,
  actions,
}) => {
  return (
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
          transform: "translateY(-2px)",
          transition: "all 0.2s ease",
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

      {/* Middle — chips + title + company + mobile salary */}
      <Box
        component={Link}
        href={`/jobs/${job.slug}`}
        sx={{ flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}
      >
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.5} sx={{ mb: 0.5 }}>
          {job.job_type && (
            <Chip
              label={jobTypeLabels[job.job_type] ?? job.job_type}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: "0.68rem", height: 20, ...jobTypeChipSx[job.job_type] }}
            />
          )}
          {job.is_remote && (
            <Chip
              label="Remote"
              size="small"
              color="info"
              variant="outlined"
              sx={{ height: 20, fontSize: "0.68rem", display: { xs: "none", sm: "inline-flex" } }}
            />
          )}
          {job.experience_level?.map((experience) => (
            <Chip
              key={experience}
              label={experienceLevelLabels[experience] ?? experience}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 20, fontSize: "0.68rem", display: { xs: "none", sm: "inline-flex" } }}
            />
          ))}
        </Stack>

        <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ lineHeight: 1.3, mb: 0.5 }}>
          {job.title}
        </Typography>

        <Typography variant="caption" color="text.secondary" noWrap>
          {job.companies?.name}
        </Typography>

        {/* Salary — visible on mobile only, shown in right column on sm+ */}
        {formatSalary(job.salary_min, job.salary_max) && (
          <Typography
            variant="caption"
            sx={{ display: { xs: "block", sm: "none" }, color: "primary.main", fontWeight: 700, mt: 0.25 }}
          >
            {formatSalary(job.salary_min, job.salary_max)}
          </Typography>
        )}
      </Box>

      {/* Right meta — location + salary + benefits (sm+) */}
      <Box
        sx={{
          display: { xs: "none", sm: "flex" },
          flexDirection: "column",
          alignItems: "flex-end",
          flexShrink: 0,
          gap: 0.5,
        }}
      >
        {showStatus && (
          <Chip
            label={job.status}
            size="small"
            color={statusColor[job.status] ?? "default"}
          />
        )}
        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
          <Typography variant="caption" color="text.secondary">
            {job.published_at ? timeAgo(job.published_at) : ""}{job.location && " în "}
          </Typography>
          {job.location && (
            <>
              <LocationOnOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {job.location}
              </Typography>
            </>
          )}
        </Stack>

        <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="flex-end">
          <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700 }}>
            {formatSalary(job.salary_min, job.salary_max)}
          </Typography>
          {job.benefits_count > 0 && (
            <Chip
              icon={<CardGiftcardOutlinedIcon sx={{ fontSize: "12px !important" }} />}
              label={job.benefits_count === 1 ? "1 beneficiu" : `${job.benefits_count} beneficii`}
              size="small"
              variant="outlined"
              sx={{
                height: 18,
                fontSize: "0.65rem",
                fontWeight: 700,
                color: "success.main",
                borderColor: "rgba(46,125,50,0.4)",
                bgcolor: "rgba(46,125,50,0.06)",
                "& .MuiChip-icon": { color: "success.main", ml: "4px" },
                "& .MuiChip-label": { pr: "6px" },
              }}
            />
          )}
        </Stack>
      </Box>

      {/* Actions — custom slot or default apply/bookmark */}
      {actions != null ? (
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{ flexShrink: 0 }}
        >
          {actions}
        </Stack>
      ) : (
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{ flexShrink: 0 }}
        >
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
              {isFavorite ? (
                <BookmarkIcon fontSize="small" />
              ) : (
                <BookmarkBorderIcon fontSize="small" />
              )}
            </IconButton>
          )}
          <ApplyButton
            job={job}
            size="small"
            sx={{
              px: 2.5,
              py: 0.75,
              fontSize: "0.75rem",
              whiteSpace: "nowrap",
              display: { xs: "inline-flex" },
            }}
          />
        </Stack>
      )}
    </Paper>
  );
};
