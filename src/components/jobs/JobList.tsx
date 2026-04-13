"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  FormControl,
  Pagination,
  Select,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ViewListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PublishIcon from "@mui/icons-material/Publish";
import UnpublishedIcon from "@mui/icons-material/Unpublished";
import ArchiveIcon from "@mui/icons-material/Archive";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import appSettings from "@/config/app.settings.json";
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
  { value: "salary_high", label: "Salariu descrescător" },
  { value: "salary_low",  label: "Salariu crescător" },
];

// ─── Responsive action bar ────────────────────────────────────────────────────

type ActionColor = "primary" | "secondary" | "success" | "warning";

interface ActionDef {
  key: string;
  label: string;
  icon: React.ReactElement;
  color: ActionColor;
  onClick: () => void;
}

interface JobActionsRowProps {
  job: JobWithCompany;
  onEdit?: (job: JobWithCompany) => void;
  onDuplicate?: (job: JobWithCompany) => void;
  onStatusChange?: (jobId: string, status: "published" | "archived" | "draft") => void;
  onArchive?: (job: JobWithCompany) => void;
}

const ACTION_COLORS: Record<ActionColor, { bg: string; hover: string }> = {
  primary:   { bg: "rgba(25,118,210,0.08)",  hover: "primary.main" },
  secondary: { bg: "rgba(62,92,118,0.08)",   hover: "secondary.main" },
  success:   { bg: "rgba(46,125,50,0.08)",   hover: "success.main" },
  warning:   { bg: "rgba(237,108,2,0.08)",   hover: "warning.main" },
};



interface JobListProps {
  /** Controlled mode — pass jobs directly; skips internal fetching */
  jobs?: JobWithCompany[];
  /** Override the "jobs found" count shown in the controls bar */
  totalCount?: number;
  /** Show sort + view-toggle bar. Defaults to true in uncontrolled mode, false in controlled. */
  showControls?: boolean;
  /** Show pagination. Defaults to true in uncontrolled mode, false in controlled. */
  showPagination?: boolean;
  /** Enable favourite toggling. Defaults to true in uncontrolled mode, false in controlled. */
  showFavorites?: boolean;
  /** Custom empty-state content rendered when the jobs list is empty */
  emptyState?: React.ReactNode;
  /** Dashboard action callbacks — when provided, renders icon buttons per row */
  onEdit?: (job: JobWithCompany) => void;
  onDuplicate?: (job: JobWithCompany) => void;
  onStatusChange?: (jobId: string, status: "published" | "archived" | "draft") => void;
  onArchive?: (job: JobWithCompany) => void;
}

export const JobList: React.FC<JobListProps> = ({
  jobs: controlledJobs,
  totalCount: controlledCount,
  showControls,
  showPagination,
  showFavorites,
  emptyState,
  onEdit,
  onDuplicate,
  onStatusChange,
  onArchive,
}) => {
  const isControlled = controlledJobs !== undefined;

  const supabase    = useSupabase();
  const { user }    = useAuth();
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const [fetchedJobs, setFetchedJobs]   = useState<JobWithCompany[]>([]);
  const [count, setCount]               = useState(0);
  const [totalPages, setTotalPages]     = useState(0);
  const [loading, setLoading]           = useState(!isControlled);
  const [favorites, setFavorites]       = useState<Set<string>>(new Set());

  const jobs = isControlled ? controlledJobs : fetchedJobs;
  const displayCount = controlledCount ?? count;

  const shouldShowControls   = showControls   ?? !isControlled;
  const shouldShowPagination = showPagination ?? !isControlled;
  const shouldShowFavorites  = showFavorites  ?? !isControlled;
  const hasActions = !!(onEdit || onDuplicate || onStatusChange || onArchive);

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
    if (isControlled) return;
    setLoading(true);
    const filters: JobSearchFilters & { page: number } = {
      q:           searchParams.get("q")          ?? undefined,
      location:    searchParams.get("location")   ?? undefined,
      type:        (searchParams.get("type")       as JobSearchFilters["type"])       ?? undefined,
      experience:  (searchParams.get("experience") as JobSearchFilters["experience"]) ?? undefined,
      salaryMin:   searchParams.get("salaryMin")  ? Number(searchParams.get("salaryMin"))  : undefined,
      salaryMax:   searchParams.get("salaryMax")  ? Number(searchParams.get("salaryMax"))  : undefined,
      remote:      searchParams.get("remote") === "true" ? true : undefined,
      minBenefits: searchParams.get("minBenefits") ? Number(searchParams.get("minBenefits")) : undefined,
      sort,
      page,
    };
    try {
      const result = await getPublishedJobs(supabase, filters);
      setFetchedJobs(result.data);
      setCount(result.count);
      setTotalPages(result.totalPages);
    } catch { /* query error */ }
    finally { setLoading(false); }
  }, [isControlled, supabase, searchParams, page, sort]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    if (shouldShowFavorites && user) {
      getUserFavorites(supabase, user.id).then(setFavorites).catch(() => {});
    }
  }, [shouldShowFavorites, supabase, user]);

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

  const renderJobActions = (job: JobWithCompany) => (
    <JobActionsRow
      job={job}
      onEdit={onEdit}
      onDuplicate={onDuplicate}
      onStatusChange={onStatusChange}
      onArchive={onArchive}
    />
  );

  const activeView = isControlled ? "list" : view;

  return (
    <Stack direction="column" gap={1} sx={{ mb: 2 }}>
      {/* Controls bar */}
      {shouldShowControls && (
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
              <><strong>{displayCount}</strong> {displayCount === 1 ? "anunț" : "anunțuri"}</>
            )}
          </Typography>

          <Stack direction="row" alignItems="center" spacing={1} sx={{ marginLeft: 0 }}>
            <FormControl size="small" sx={{ minWidth: 0 }}>
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
      )}

      {/* Content */}
      {loading ? (
        activeView === "list" ? <ListSkeleton /> : <GridSkeleton />
      ) : jobs.length === 0 ? (
        emptyState ?? (
          <Box sx={{ textAlign: "center", py: 10 }}>
            <WorkOutlineIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
            <Typography variant="h5" sx={{ mb: 0.5 }}>Nu au fost găsite locuri de muncă</Typography>
            <Typography color="text.secondary">Încearcă să ajustezi filtrele de căutare.</Typography>
          </Box>
        )
      ) : activeView === "list" ? (
        <Stack spacing={1.5}>
          {jobs.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              isFavorite={favorites.has(job.id)}
              onToggleFavorite={shouldShowFavorites && user ? handleToggleFavorite : undefined}
              showStatus={hasActions}
              actions={hasActions ? renderJobActions(job) : undefined}
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
              onToggleFavorite={shouldShowFavorites && user ? handleToggleFavorite : undefined}
            />
          ))}
        </Box>
      )}

      {/* Pagination */}
      {shouldShowPagination && totalPages > 1 && (
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
  );
};
const JobActionsRow: React.FC<JobActionsRowProps> = ({
  job, onEdit, onDuplicate, onStatusChange, onArchive,
}) => {
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.up("md"));
  const isSm = useMediaQuery(theme.breakpoints.up("sm"));
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const actions: ActionDef[] = [
    onStatusChange && job.status === "draft" ? {
      key: "publish", label: "Publică", color: "success" as ActionColor,
      icon: <PublishIcon fontSize="small" />,
      onClick: () => { onStatusChange(job.id, "published"); },
    } : null,
    onEdit ? {
      key: "edit", label: "Editează", color: "primary" as ActionColor,
      icon: <EditIcon fontSize="small" />,
      onClick: () => onEdit(job),
    } : null,
    onDuplicate ? {
      key: "duplicate", label: "Duplică", color: "secondary" as ActionColor,
      icon: <ContentCopyIcon fontSize="small" />,
      onClick: () => onDuplicate(job),
    } : null,
    onStatusChange && job.status === "published" ? {
      key: "unpublish", label: "Dezactivează", color: "warning" as ActionColor,
      icon: <UnpublishedIcon fontSize="small" />,
      onClick: () => { onStatusChange(job.id, "draft"); },
    } : null,
    onArchive && appSettings.features.archiveJobs && job.status !== "archived" ? {
      key: "archive", label: "Arhivează", color: "warning" as ActionColor,
      icon: <ArchiveIcon fontSize="small" />,
      onClick: () => onArchive(job),
    } : null,
  ].filter((a): a is ActionDef => a !== null);

  // Desktop: 2 buttons + overflow menu; tablet: 1 button with text + menu; mobile: 1 icon-only + menu
  // const visibleCount = isMd ? 2 : 1;
  const visibleCount = 1;
  const visible = actions.slice(0, visibleCount);
  const overflow = actions.slice(visibleCount);

  const [primary, ...rest] = visible;

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {/* Primary button — always shown */}
      {primary && (
        <Tooltip title={!isSm ? primary.label : ""}>
          <Button
            size="small"
            variant="contained"
            color={primary.color}
            onClick={primary.onClick}
            startIcon={isSm ? primary.icon : undefined}
            sx={{
              minWidth: 0,
              px: isSm ? 1.5 : 1,
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": { boxShadow: "none" },
              whiteSpace: "nowrap",
            }}
          >
            {isSm ? primary.label : primary.icon}
          </Button>
        </Tooltip>
      )}

      {/* Secondary button — desktop only */}
      {rest.map((action) => (
        <Button
          key={action.key}
          size="small"
          variant="outlined"
          color={action.color}
          onClick={action.onClick}
          startIcon={action.icon}
          sx={{ fontWeight: 500, whiteSpace: "nowrap", boxShadow: "none" }}
        >
          {action.label}
        </Button>
      ))}

      {/* Overflow hamburger menu */}
      {overflow.length > 0 && (
        <>
          <Tooltip title="Mai multe acțiuni">
            <IconButton
              size="small"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{ color: "text.secondary" }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{ paper: { sx: { minWidth: 160, borderRadius: 2, mt: 0.5 } } }}
          >
            {overflow.flatMap((action, i) => [
              i > 0 && action.key === "archive" ? (
                <Divider key={`divider-${action.key}`} />
              ) : null,
              <MenuItem
                key={action.key}
                onClick={() => { action.onClick(); setMenuAnchor(null); }}
                sx={{ gap: 1.5, py: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 0, color: `${action.color}.main` }}>
                  {action.icon}
                </ListItemIcon>
                <ListItemText
                  primary={action.label}
                  primaryTypographyProps={{ variant: "body2", color: `${action.color}.main`, fontWeight: 500 }}
                />
              </MenuItem>,
            ].filter((x): x is React.ReactElement => x !== null))}
          </Menu>
        </>
      )}
    </Stack>
  );
};