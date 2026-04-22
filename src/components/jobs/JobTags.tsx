"use client";

import React from "react";
import { Stack, Chip } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import type { Tables } from "@/types/database";
import { jobTypeLabels, jobTypeChipSx, experienceLevelLabels } from "@/lib/utils";

type JobTagsJob = Pick<
  Tables<"job_listings">,
  "job_type" | "experience_level" | "is_remote" | "location"
>;

interface JobTagsProps {
  job: JobTagsJob;
  sx?: SxProps<Theme>;
  hideLocation?: boolean;
}

export function JobTags({ job, sx, hideLocation = false }: JobTagsProps) {
  const { job_type, experience_level, is_remote, location } = job;

  const hasExperience = experience_level && experience_level.length > 0;
  if (!job_type && !hasExperience && !is_remote && !location) return null;

  return (
    <Stack direction="row" flexWrap="wrap" gap={0.75} sx={sx}>
      {job_type && (
        <Chip
          label={jobTypeLabels[job_type] ?? job_type}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600, ...jobTypeChipSx[job_type] }}
        />
      )}
      {experience_level && experience_level.length > 0 &&
        experience_level.map((lvl) => (
          <Chip
            key={lvl}
            label={experienceLevelLabels[lvl] ?? lvl}
            size="small"
            variant="outlined"
          />
        ))}
      {is_remote && (
        <Chip label="Remote" size="small" color="info" variant="outlined" />
      )}
      {location && !hideLocation && (
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
