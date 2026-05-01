"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import BookmarkRemoveIcon from "@mui/icons-material/BookmarkRemove";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BusinessIcon from "@mui/icons-material/Business";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import InboxIcon from "@mui/icons-material/Inbox";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import {
  getFavouriteJobs,
  getFavouriteCompanies,
  toggleJobFavourite,
  toggleCompanyFavourite,
  type FavouriteJob,
  type FavouriteCompany,
} from "@/services/favourites.service";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { formatSalary, timeAgo } from "@/lib/utils";
import appSettings from "@/config/app.settings.json";
import { CompanyLogoAvatar } from "@/components/company/CompanyLogoAvatar";

function RowSkeleton() {
  return (
    <Stack spacing={1.5}>
      {[0, 1, 2].map((i) => (
        <Skeleton
          key={i}
          variant="rounded"
          height={76}
          sx={{ borderRadius: 2 }}
        />
      ))}
    </Stack>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Paper
      sx={{
        p: 6,
        textAlign: "center",
        border: "1px solid rgba(3, 23, 12, 0.1)",
        borderRadius: 2,
      }}
    >
      <Box sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}>{icon}</Box>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Paper>
  );
}

export function FavouritesClient() {
  if (!appSettings.features.favourites) {
    return (
      <Typography variant="body1" color="text.secondary">
        Funcționalitatea de favorite nu este activată.
      </Typography>
    );
  }

  return <FavouritesContent />;
}

function FavouritesContent() {
  const { user } = useAuth();
  const supabase = useSupabase();

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<FavouriteJob[]>([]);
  const [companies, setCompanies] = useState<FavouriteCompany[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [j, c] = await Promise.all([
        getFavouriteJobs(supabase, user.id),
        getFavouriteCompanies(supabase, user.id),
      ]);
      setJobs(j);
      setCompanies(c);
    } catch {
      /* silent – user sees empty state */
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRemoveJob = async (jobId: string) => {
    if (!user) return;
    await toggleJobFavourite(supabase, user.id, jobId);
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  const handleRemoveCompany = async (companyId: string) => {
    if (!user) return;
    await toggleCompanyFavourite(supabase, user.id, companyId);
    setCompanies((prev) => prev.filter((c) => c.id !== companyId));
  };

  return (
    <>
      <DashboardPageHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <BookmarkIcon sx={{ color: "primary.main" }} />
            <Typography variant="h3">Favorite</Typography>
          </Stack>
        }
      />

      <Tabs
        value={tab}
        onChange={(_, v: number) => setTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab
          label={
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <WorkOutlineIcon fontSize="small" />
              <span>Anunțuri</span>
              {jobs.length > 0 && (
                <Chip
                  label={jobs.length}
                  size="small"
                  sx={{ height: 18, fontSize: "0.65rem" }}
                />
              )}
            </Stack>
          }
        />
        <Tab
          label={
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <BusinessIcon fontSize="small" />
              <span>Companii</span>
              {companies.length > 0 && (
                <Chip
                  label={companies.length}
                  size="small"
                  sx={{ height: 18, fontSize: "0.65rem" }}
                />
              )}
            </Stack>
          }
        />
      </Tabs>

      {/* ── Jobs tab ─────────────────────────────────────────────────────────── */}
      {tab === 0 &&
        (loading ? (
          <RowSkeleton />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={<WorkOutlineIcon sx={{ fontSize: 48 }} />}
            title="Niciun anunț salvat"
            description="Apasă iconița de bookmark pe un anunț pentru a-l salva aici."
          />
        ) : (
          <Stack spacing={1.5}>
            {jobs.map((job) => (
              <Paper
                key={job.id}
                sx={{
                  display: "flex",
                  alignItems: { xs: "flex-start", sm: "center" },
                  flexDirection: { xs: "column", sm: "row" },
                  gap: { xs: 1.5, sm: 2 },
                  px: { xs: 2, sm: 3 },
                  py: 2,
                  border: "1px solid rgba(3, 23, 12, 0.1)",
                  borderRadius: 2,
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": { borderColor: "rgba(62, 92, 118, 0.35)", boxShadow: "0 4px 20px rgba(3, 23, 12, 0.08)" },
                }}
              >
                {/* Logo */}
                <CompanyLogoAvatar
                  logoUrl={job.companies?.logo_url}
                  alt={job.companies?.name ?? ""}
                  size={44}
                  fallback={<WorkOutlineIcon sx={{ color: "text.secondary", fontSize: 20 }} />}
                />

                {/* Info */}
                <Box
                  component={Link}
                  href={`/jobs/${job.slug}`}
                  sx={{ flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}
                >
                  <Typography variant="subtitle2" fontWeight={700} noWrap>
                    {job.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {job.companies?.name ?? "—"}
                    {job.location ? ` · ${job.location}` : ""}
                    {job.published_at ? ` · ${timeAgo(job.published_at)}` : ""}
                  </Typography>
                  {formatSalary(job.salary_min, job.salary_max) && (
                    <Typography
                      variant="caption"
                      sx={{ display: "block", color: "primary.main", fontWeight: 700 }}
                    >
                      {formatSalary(job.salary_min, job.salary_max)}
                    </Typography>
                  )}
                </Box>

                {/* Actions */}
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ flexShrink: 0, alignSelf: { xs: "flex-end", sm: "center" } }}
                >
                  <Button
                    component={Link}
                    href={`/jobs/${job.slug}`}
                    size="small"
                    variant="outlined"
                    endIcon={<OpenInNewIcon fontSize="small" />}
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    Vezi anunțul
                  </Button>
                  <Tooltip title="Elimină din favorite">
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<BookmarkRemoveIcon fontSize="small" />}
                      onClick={() => void handleRemoveJob(job.id)}
                      aria-label={`Elimină ${job.title} din favorite`}
                    >
                      Elimină
                    </Button>
                  </Tooltip>
                </Stack>
              </Paper>
            ))}
          </Stack>
        ))}

      {/* ── Companies tab ─────────────────────────────────────────────────────── */}
      {tab === 1 &&
        (loading ? (
          <RowSkeleton />
        ) : companies.length === 0 ? (
          <EmptyState
            icon={<BusinessIcon sx={{ fontSize: 48 }} />}
            title="Nicio companie salvată"
            description="Apasă iconița de bookmark pe o pagină de companie pentru a o salva aici."
          />
        ) : (
          <Stack spacing={1.5}>
            {companies.map((company) => (
              <Paper
                key={company.id}
                sx={{
                  display: "flex",
                  alignItems: { xs: "flex-start", sm: "center" },
                  flexDirection: { xs: "column", sm: "row" },
                  gap: { xs: 1.5, sm: 2 },
                  px: { xs: 2, sm: 3 },
                  py: 2,
                  border: "1px solid rgba(3, 23, 12, 0.1)",
                  borderRadius: 2,
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": { borderColor: "rgba(62, 92, 118, 0.35)", boxShadow: "0 4px 20px rgba(3, 23, 12, 0.08)" },
                }}
              >
                {/* Logo */}
                <CompanyLogoAvatar
                  logoUrl={company.logo_url}
                  alt={company.name}
                  variant="rounded"
                  size={44}
                  sx={{ borderRadius: 0 }}
                  fallback={<BusinessIcon sx={{ color: "text.secondary", fontSize: 20 }} />}
                />

                {/* Info */}
                <Box
                  component={Link}
                  href={`/companies/${company.slug}`}
                  sx={{ flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}
                >
                  <Typography variant="subtitle2" fontWeight={700}>
                    {company.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {[company.industry, company.location]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </Typography>
                </Box>

                {/* Actions */}
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ flexShrink: 0, alignSelf: { xs: "flex-end", sm: "center" } }}
                >
                  <Button
                    component={Link}
                    href={`/companies/${company.slug}`}
                    size="small"
                    variant="outlined"
                    endIcon={<OpenInNewIcon fontSize="small" />}
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    Vezi compania
                  </Button>
                  <Tooltip title="Elimină din favorite">
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<BookmarkRemoveIcon fontSize="small" />}
                      onClick={() => void handleRemoveCompany(company.id)}
                      aria-label={`Elimină ${company.name} din favorite`}
                    >
                      Elimină
                    </Button>
                  </Tooltip>
                </Stack>
              </Paper>
            ))}
          </Stack>
        ))}
    </>
  );
}
