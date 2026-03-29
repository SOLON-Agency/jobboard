"use client";

import React from "react";
import { Stack, Chip } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import type { Tables } from "@/types/database";
import { jobTypeLabels, experienceLevelLabels } from "@/lib/utils";

type JobTagsJob = Pick<
  Tables<"job_listings">,
  "job_type" | "experience_level" | "is_remote" | "location"
>;

interface JobTagsProps {
  job: JobTagsJob;
  sx?: SxProps<Theme>;
}

export const JobTags: React.FC<JobTagsProps> = ({ job, sx }) => {
  const { job_type, experience_level, is_remote, location } = job;

  if (!job_type && !experience_level && !is_remote && !location) return null;

  return (
    <Stack direction="row" flexWrap="wrap" gap={0.75} sx={sx}>
      {job_type && (
        <Chip
          label={jobTypeLabels[job_type] ?? job_type}
          size="small"
          variant="outlined"
        />
      )}
      {experience_level && (
        <Chip
          label={experienceLevelLabels[experience_level] ?? experience_level}
          size="small"
          variant="outlined"
        />
      )}
      {is_remote && (
        <Chip label="Remote" size="small" color="primary" variant="outlined" />
      )}
      {location && (
        <Chip
          icon={<LocationOnOutlinedIcon />}
          label={location}
          size="small"
          variant="outlined"
        />
      )}
    </Stack>
  );
};
