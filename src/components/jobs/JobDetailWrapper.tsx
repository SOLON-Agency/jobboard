"use client";

import React, { useCallback, useEffect, useState } from "react";
import { JobDetail } from "./JobDetail";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { toggleFavorite, getUserFavorites } from "@/services/jobs.service";
import type { Tables } from "@/types/database";
import type { BenefitItem } from "@/services/benefits.service";

type JobWithCompany = Tables<"job_listings"> & {
  companies: Tables<"companies"> | null;
};

interface JobDetailWrapperProps {
  job: JobWithCompany;
  benefits?: BenefitItem[];
}

export const JobDetailWrapper: React.FC<JobDetailWrapperProps> = ({ job, benefits = [] }) => {
  const { user } = useAuth();
  const supabase = useSupabase();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (user) {
      getUserFavorites(supabase, user.id).then((favs) => {
        setIsFavorite(favs.has(job.id));
      }).catch(() => {});
    }
  }, [supabase, user, job.id]);

  const handleToggleFavorite = useCallback(async () => {
    if (!user) return;
    const result = await toggleFavorite(supabase, user.id, job.id);
    setIsFavorite(result);
  }, [supabase, user, job.id]);

  return (
    <JobDetail
      job={job}
      benefits={benefits}
      isFavorite={isFavorite}
      onToggleFavorite={user ? handleToggleFavorite : undefined}
    />
  );
};
