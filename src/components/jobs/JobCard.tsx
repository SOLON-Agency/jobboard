"use client";

import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Box,
  Avatar,
  IconButton,
} from "@mui/material";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import type { Tables } from "@/types/database";
import { formatSalary, timeAgo, jobTypeLabels } from "@/lib/utils";

interface JobCardProps {
  job: Tables<"job_listings"> & { companies: Tables<"companies"> | null };
  isFavorite?: boolean;
  onToggleFavorite?: (jobId: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  isFavorite = false,
  onToggleFavorite,
}) => (
  <Card
    sx={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      cursor: "pointer",
      "&:hover": {
        borderColor: "primary.main",
        transform: "translateY(-2px)",
        transition: "all 0.2s ease",
      },
    }}
  >
    <CardContent
      component={Link}
      href={`/jobs/${job.slug}`}
      sx={{ textDecoration: "none", color: "inherit", flexGrow: 1, p: 3 }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
        <Avatar
          src={job.companies?.logo_url ?? undefined}
          sx={{
            width: 44,
            height: 44,
            flexShrink: 0,
            bgcolor: "background.default",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <WorkOutlineIcon sx={{ color: "text.secondary", fontSize: 20 }} />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              lineHeight: 1.3,
            }}
          >
            {job.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {job.companies?.name}
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        {job.job_type && (
          <Chip
            label={jobTypeLabels[job.job_type] ?? job.job_type}
            size="small"
            variant="outlined"
          />
        )}
        {job.is_remote && (
          <Chip label="Remote" size="small" color="primary" variant="outlined" />
        )}
        {job.is_external && (
          <Chip label="External" size="small" variant="outlined" />
        )}
      </Stack>

      <Stack spacing={0.5}>
        {job.location && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <LocationOnOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              {job.location}
            </Typography>
          </Stack>
        )}
        <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 600 }}>
          {formatSalary(job.salary_min, job.salary_max, job.salary_currency ?? "EUR")}
        </Typography>
      </Stack>
    </CardContent>

    <Box
      sx={{
        px: 3,
        pb: 2,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {job.published_at ? timeAgo(job.published_at) : "Draft"}
      </Typography>
      {onToggleFavorite && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite(job.id);
          }}
          sx={{ color: isFavorite ? "error.main" : "text.secondary" }}
        >
          {isFavorite ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
        </IconButton>
      )}
    </Box>
  </Card>
);
