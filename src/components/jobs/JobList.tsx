"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Box,
  Typography,
  Pagination,
  CircularProgress,
  Stack,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Skeleton,
  Tooltip,
} from "@mui/material";
import ViewListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { JobCard } from "./JobCard";
import { JobRow } from "./JobRow";
import { useSupabase } from "@/hooks/useSupabase";
import { useAuth } from "@/hooks/useAuth";
import { getPublishedJobs, getUserFavorites, toggleFavorite } from "@/services/jobs.service";
import type { Tables } from "@/types/database";
import type { JobSearchFilters, JobSortOption } from "@/types";

type JobWithCompany = Tables<"job_listings"> & { companies: Tables<"companies"> | null };

const SORT_OPTIONS: { value: JobSortOption; label: string }[] = [
  { value: "newest",      label: "Cele mai noi" },
  { value: "oldest",      label: "Cele mai vechi" },
  { value: "salary_high", label: "Salariu: Mare → Mic" },
  { value: "salary_low",  label: "Salariu: Mic → Mare" },
];

export const JobList: React.FC = () => {
  const supabase    = useSupabase();
  const { user }    = useAuth();
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const [jobs, setJobs]             = useState<JobWithCompany[]>([]);
  const [count, setCount]           = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [favorites, setFavorites]   = useState<Set<string>>(new Set());

  const page  = Number(searchParams.get("page") ?? "1");
  const sort  = (searchParams.get("sort") ?? "newest") as JobSortOption;
  const view  = searchParams.get("view") === "grid" ? "grid" : "list";

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const filters: JobSearchFilters & { page: number } = {
      q:          searchParams.get("q")          ?? undefined,
      location:   searchParams.get("location")   ?? undefined,
      type:       (searchParams.get("type")       as JobSearchFilters["type"])       ?? undefined,
      experience: (searchParams.get("experience") as JobSearchFilters["experience"]) ?? undefined,
      salaryMin:  searchParams.get("salaryMin")  ? Number(searchParams.get("salaryMin"))  : undefined,
      salaryMax:  searchParams.get("salaryMax")  ? Number(searchParams.get("salaryMax"))  : undefined,
      remote:     searchParams.get("remote") === "true" ? true : undefined,
      sort,
      page,
    };
    try {
      const result = await getPublishedJobs(supabase, filters);
      setJobs(result.data);
      setCount(result.count);
      setTotalPages(result.totalPages);
    } catch { /* query error */ }
    finally { setLoading(false); }
  }, [supabase, searchParams, page, sort]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    if (user) getUserFavorites(supabase, user.id).then(setFavorites).catch(() => {});
  }, [supabase, user]);

  const handleToggleFavorite = async (jobId: string) => {
    if (!user) return;
    const isFav = await toggleFavorite(supabase, user.id, jobId);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFav) next.add(jobId); else next.delete(jobId);
      return next;
    });
  };

  const ListSkeleton = () => (
    <Stack spacing={1.5}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 2 }} />
      ))}
    </Stack>
  );

  const GridSkeleton = () => (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={200} sx={{ borderRadius: 2 }} />
      ))}
    </Box>
  );

  return (
    <>
      {/* Header bar */}
      <Stack direction="column" gap={1} sx={{ mb: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
        sx={{ mb: 2 }}
      >
        <Typography variant="body2" color="text.secondary">
          {loading ? (
            <Skeleton variant="text" width={120} />
          ) : (
            <>Au fost găsite <strong>{count}</strong> {count === 1 ? "loc de muncă" : "locuri de muncă"}</>
          )}
        </Typography>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
            Sortare:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <Select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value)}
              displayEmpty
              sx={{ fontSize: "0.8rem" }}
            >
              {SORT_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value} sx={{ fontSize: "0.8rem" }}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack direction="row" sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
            <Tooltip title="Vizualizare listă">
              <IconButton
                size="small"
                onClick={() => setParam("view", "list")}
                sx={{
                  borderRadius: 0,
                  bgcolor: view === "list" ? "action.selected" : "transparent",
                  color: view === "list" ? "primary.main" : "text.secondary",
                }}
              >
                <ViewListIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Vizualizare grilă">
              <IconButton
                size="small"
                onClick={() => setParam("view", "grid")}
                sx={{
                  borderRadius: 0,
                  bgcolor: view === "grid" ? "action.selected" : "transparent",
                  color: view === "grid" ? "primary.main" : "text.secondary",
                }}
              >
                <GridViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Stack>

        {/* Content */}
      {loading ? (
        view === "list" ? <ListSkeleton /> : <GridSkeleton />
      ) : jobs.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <WorkOutlineIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="h5" sx={{ mb: 0.5 }}>Nu au fost găsite locuri de muncă</Typography>
          <Typography color="text.secondary">Încearcă să ajustezi filtrele de căutare.</Typography>
        </Box>
      ) : view === "list" ? (
        <Stack spacing={1.5}>
          {jobs.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              isFavorite={favorites.has(job.id)}
              onToggleFavorite={user ? handleToggleFavorite : undefined}
            />
          ))}
        </Stack>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isFavorite={favorites.has(job.id)}
              onToggleFavorite={user ? handleToggleFavorite : undefined}
            />
          ))}
        </Box>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("page", String(newPage));
              router.push(`${pathname}?${params.toString()}`);
            }}
            color="primary"
          />
        </Box>
      )}
      </Stack>


      
    </>
  );
};
