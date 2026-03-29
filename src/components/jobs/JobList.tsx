"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Typography, Pagination, CircularProgress } from "@mui/material";
import { JobCard } from "./JobCard";
import { useSupabase } from "@/hooks/useSupabase";
import { useAuth } from "@/hooks/useAuth";
import { getPublishedJobs, getUserFavorites, toggleFavorite } from "@/services/jobs.service";
import type { Tables } from "@/types/database";
import type { JobSearchFilters } from "@/types";

type JobWithCompany = Tables<"job_listings"> & { companies: Tables<"companies"> | null };

export const JobList: React.FC = () => {
  const supabase = useSupabase();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [jobs, setJobs] = useState<JobWithCompany[]>([]);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const page = Number(searchParams.get("page") ?? "1");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const filters: JobSearchFilters & { page: number } = {
      q: searchParams.get("q") ?? undefined,
      location: searchParams.get("location") ?? undefined,
      type: (searchParams.get("type") as JobSearchFilters["type"]) ?? undefined,
      experience: (searchParams.get("experience") as JobSearchFilters["experience"]) ?? undefined,
      salaryMin: searchParams.get("salaryMin") ? Number(searchParams.get("salaryMin")) : undefined,
      remote: searchParams.get("remote") === "true" ? true : undefined,
      page,
    };

    try {
      const result = await getPublishedJobs(supabase, filters);
      setJobs(result.data);
      setCount(result.count);
      setTotalPages(result.totalPages);
    } catch {
      /* query error */
    } finally {
      setLoading(false);
    }
  }, [supabase, searchParams, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (user) {
      getUserFavorites(supabase, user.id).then(setFavorites).catch(() => {});
    }
  }, [supabase, user]);

  const handleToggleFavorite = async (jobId: string) => {
    if (!user) return;
    const isFav = await toggleFavorite(supabase, user.id, jobId);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFav) next.add(jobId);
      else next.delete(jobId);
      return next;
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (jobs.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          No jobs found
        </Typography>
        <Typography color="text.secondary">
          Try adjusting your search filters.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {/* <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {count} job{count !== 1 ? "s" : ""} found
      </Typography> */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
        }}
      >
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            isFavorite={favorites.has(job.id)}
            onToggleFavorite={user ? handleToggleFavorite : undefined}
          />
        ))}
      </Box>

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("page", String(newPage));
              window.history.pushState(null, "", `?${params.toString()}`);
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            color="primary"
          />
        </Box>
      )}
    </>
  );
};
