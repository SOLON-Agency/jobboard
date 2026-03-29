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
} from "@mui/material";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import ShareIcon from "@mui/icons-material/Share";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import type { Tables } from "@/types/database";
import {
  formatSalary,
  timeAgo,
  jobTypeLabels,
  experienceLevelLabels,
} from "@/lib/utils";

type JobWithCompany = Tables<"job_listings"> & {
  companies: Tables<"companies"> | null;
};

interface JobDetailProps {
  job: JobWithCompany;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const JobDetail: React.FC<JobDetailProps> = ({
  job,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const [snackOpen, setSnackOpen] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: job.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      setSnackOpen(true);
    }
  };

  return (
    <>
      <Paper sx={{ p: { xs: 3, md: 4 }, border: "1px solid", borderColor: "divider" }}>
        <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 3 }}>
          <Avatar
            src={job.companies?.logo_url ?? undefined}
            sx={{
              width: 64,
              height: 64,
              bgcolor: "background.default",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <WorkOutlineIcon sx={{ fontSize: 32, color: "text.secondary" }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h2" sx={{ mb: 0.5 }}>
              {job.title}
            </Typography>
            {job.companies && (
              <Typography
                component={Link}
                href={`/companies/${job.companies.slug}`}
                variant="h5"
                sx={{
                  color: "primary.main",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {job.companies.name}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            <IconButton onClick={handleShare}>
              <ShareIcon />
            </IconButton>
            {onToggleFavorite && (
              <IconButton
                onClick={onToggleFavorite}
                sx={{ color: isFavorite ? "error.main" : "text.secondary" }}
              >
                {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
            )}
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
          {job.job_type && (
            <Chip label={jobTypeLabels[job.job_type] ?? job.job_type} variant="outlined" />
          )}
          {job.experience_level && (
            <Chip
              label={experienceLevelLabels[job.experience_level] ?? job.experience_level}
              variant="outlined"
            />
          )}
          {job.is_remote && <Chip label="Remote" color="primary" variant="outlined" />}
          {job.location && (
            <Chip
              icon={<LocationOnOutlinedIcon />}
              label={job.location}
              variant="outlined"
            />
          )}
          {job.is_external && <Chip label="External" variant="outlined" />}
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: "background.default" }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Salary
            </Typography>
            <Typography variant="h5" sx={{ color: "primary.main" }}>
              {formatSalary(job.salary_min, job.salary_max, job.salary_currency ?? "EUR")}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Posted
            </Typography>
            <Typography variant="h5">
              {job.published_at ? timeAgo(job.published_at) : "Draft"}
            </Typography>
          </Box>
          {job.expires_at && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Expires
              </Typography>
              <Typography variant="h5">
                {new Date(job.expires_at).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Box
          sx={{
            "& h1, & h2, & h3": { mt: 3, mb: 1.5 },
            "& p": { mb: 2, lineHeight: 1.7, color: "text.secondary" },
            "& ul, & ol": { pl: 3, mb: 2, color: "text.secondary" },
            "& li": { mb: 0.5 },
            "& a": { color: "primary.main" },
          }}
        >
          <ReactMarkdown>{job.description ?? ""}</ReactMarkdown>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          {job.application_url ? (
            <Button
              variant="contained"
              size="large"
              href={job.application_url}
              target="_blank"
              endIcon={<OpenInNewIcon />}
              sx={{ px: 4 }}
            >
              Apply Externally
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              component={Link}
              href={`/jobs/${job.slug}#apply`}
              sx={{ px: 4 }}
            >
              Apply Now
            </Button>
          )}
          <Button
            variant="outlined"
            size="large"
            href={`mailto:?subject=${encodeURIComponent(`Job: ${job.title}`)}&body=${encodeURIComponent(window.location.href)}`}
          >
            Recommend via Email
          </Button>
        </Stack>
      </Paper>

      <Snackbar
        open={snackOpen}
        autoHideDuration={2000}
        onClose={() => setSnackOpen(false)}
        message="Link copied to clipboard"
      />
    </>
  );
};
