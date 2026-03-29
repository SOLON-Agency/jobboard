"use client";

import React from "react";
import { Stack, Typography } from "@mui/material";
import { JobCard } from "@/components/jobs/JobCard";
import type { Tables } from "@/types/database";

interface CompanyJobListProps {
  jobs: Tables<"job_listings">[];
}

export const CompanyJobList: React.FC<CompanyJobListProps> = ({ jobs }) => {
  if (jobs.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
        No open positions at this time.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {jobs.map((job) => (
        <JobCard key={job.id} job={{ ...job, companies: null }} />
      ))}
    </Stack>
  );
};
