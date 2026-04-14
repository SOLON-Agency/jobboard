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
import { formatSalary, timeAgo, jobTypeLabels, jobTypeChipSx, truncate } from "@/lib/utils";
import appSettings from "@/config/app.settings.json";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";

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
      position: "relative",
      cursor: "pointer",
      "&:hover": {
        borderColor: "primary.main",
        transform: "translateY(-2px)",
        transition: "all 0.2s ease",
      },
    }}
  >
    {/* Full-card overlay link — the only <a> that wraps the card area */}
    <Link
      href={`/jobs/${job.slug}`}
      aria-label={`Vizualizează anunțul: ${job.title}`}
      style={{ position: "absolute", inset: 0, zIndex: 0 }}
    />

    <CardContent sx={{ color: "inherit", flexGrow: 1, p: 3, position: "relative", zIndex: 1 }}>
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
            borderRadius: 0,
          }}
        >
          <WorkOutlineIcon sx={{ color: "text.secondary", fontSize: 20 }} />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="flex-start" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ lineHeight: 1.3, wordBreak: "break-word", overflowWrap: "break-word" }}
            >
              {truncate(job.title)}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ flexShrink: 0 }}>
              {job.job_type && (
                <Chip
                  label={jobTypeLabels[job.job_type] ?? job.job_type}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: "0.7rem", ...jobTypeChipSx[job.job_type] }}
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
              sx={{
                position: "relative",
                zIndex: 2,
                textDecoration: "none",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                "&:hover": { color: "primary.main" },
              }}
            >
              {truncate(job.companies.name)}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary"
              sx={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
              {truncate(job.companies?.name ?? "")}
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

        <Button
          component={Link}
          href={`/jobs/${job.slug}`}
          variant="contained"
          size="small"
          endIcon={<AutoAwesomeIcon />}
          sx={{
            position: "relative",
            zIndex: 2,
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
