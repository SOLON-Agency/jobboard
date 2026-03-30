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
  Button,
} from "@mui/material";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import type { Tables } from "@/types/database";
import { formatSalary, timeAgo, jobTypeLabels } from "@/lib/utils";
import appSettings from "@/config/app.settings.json";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
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
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="flex-start"
        sx={{ mb: 2 }}
      >
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
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
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
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {job.job_type && (
                <Chip
                  label={jobTypeLabels[job.job_type] ?? job.job_type}
                  size="small"
                  variant="outlined"
                />
              )}
              {job.is_remote && (
                <Chip
                  label="Remote"
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {job.is_external && (
                <Chip label="Extern" size="small" variant="outlined" />
              )}
            </Stack>
          </Stack>
          {job.companies?.slug ? (
            <Typography
              component={Link}
              href={`/companies/${job.companies.slug}`}
              variant="body2"
              color="text.secondary"
              noWrap
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              sx={{
                textDecoration: "none",
                "&:hover": { color: "primary.main" },
              }}
            >
              {job.companies.name}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" noWrap>
              {job.companies?.name}
            </Typography>
          )}
        </Box>
      </Stack>
      <Stack direction="row" spacing={0.5} justifyContent="space-between" alignItems="flex-end" sx={{ mb: 1 }}>
        <Stack direction="column" spacing={0.5} alignItems="flex-start">
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {job.published_at ? timeAgo(job.published_at) : "Ciornă"}{" "}
              {job.location && "în "}
            </Typography>{" "}
            {job.location && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <LocationOnOutlinedIcon
                  sx={{ fontSize: 16, color: "text.secondary" }}
                />
                <Typography variant="body2" color="text.secondary">
                  {job.location}
                </Typography>
              </Stack>
            )}
          </Stack>

          <Stack spacing={0.5}>
            <Typography
              variant="body2"
              sx={{ color: "primary.main", fontWeight: 600 }}
            >
              {formatSalary(job.salary_min, job.salary_max)}
            </Typography>
          </Stack>
        </Stack>

        <Button
          component={Link}
          href={`/jobs/${job.slug}`}
          variant="contained"
          size="small"
          endIcon={<AutoAwesomeIcon />}
          sx={{
            borderRadius: 5,
            px: 2.5,
            py: 0.75,
            fontWeight: 700,
            fontSize: "0.75rem",
            whiteSpace: "nowrap",
            maxHeight: "32px",
          }}
        >
          Aplică
        </Button>
      </Stack>
    </CardContent>

    {appSettings.features.favouriteJobs && (
      <Box
        sx={{
          px: 3,
          pb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {onToggleFavorite && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite(job.id);
            }}
            sx={{ color: isFavorite ? "error.main" : "text.secondary" }}
          >
            {isFavorite ? (
              <BookmarkIcon fontSize="small" />
            ) : (
              <BookmarkBorderIcon fontSize="small" />
            )}
          </IconButton>
        )}
      </Box>
    )}
  </Card>
);
