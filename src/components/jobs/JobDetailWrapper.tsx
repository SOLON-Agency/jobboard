"use client";

import React from "react";
import { JobDetail } from "./JobDetail";
import { useAuth } from "@/hooks/useAuth";
import { useFavourites } from "@/hooks/useFavourites";
import type { Tables } from "@/types/database";
import type { BenefitItem } from "@/services/benefits.service";

type JobWithCompany = Tables<"job_listings"> & {
  companies: Tables<"companies"> | null;
};

interface JobDetailWrapperProps {
  job: JobWithCompany;
  benefits?: BenefitItem[];
}

export function JobDetailWrapper({ job, benefits = [] }: JobDetailWrapperProps) {
  const { user } = useAuth();
  const { isJobFavourite, toggleJob } = useFavourites();

  return (
    <JobDetail
      job={job}
      benefits={benefits}
      isFavorite={isJobFavourite(job.id)}
      onToggleFavorite={user ? () => toggleJob(job.id) : undefined}
    />
  );
}
