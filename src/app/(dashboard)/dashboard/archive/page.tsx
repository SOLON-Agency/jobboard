"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import InboxIcon from "@mui/icons-material/Inbox";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import {
  getArchivedCompanies,
  archiveCompany,
  type CompanyWithJobCount,
} from "@/services/companies.service";
import { getArchivedJobs, archiveJob } from "@/services/jobs.service";
import { getArchivedForms, archiveForm } from "@/services/forms.service";
import { formatDate } from "@/lib/utils";
import type { Tables } from "@/types/database";
import appSettings from "@/config/app.settings.json";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";

type ArchivedJob = Tables<"job_listings"> & { companies: Tables<"companies"> | null };
type ArchivedForm = Tables<"forms">;
type ArchivedCompany = Tables<"companies"> & { role: string };

const jobStatusLabels: Record<string, string> = {
  draft: "Ciornă",
  published: "Publicat",
  archived: "Arhivat",
};

const jobStatusColor: Record<string, "default" | "success" | "warning"> = {
  draft: "warning",
  published: "success",
  archived: "default",
};

function EmptyArchive({ label }: { label: string }) {
  return (
    <Paper
      sx={{
        p: 6,
        textAlign: "center",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <InboxIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Niciun {label} arhivat
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Elementele pe care le arhivezi vor apărea aici.
      </Typography>
    </Paper>
  );
}

function RowSkeleton() {
  return (
    <Stack spacing={1.5}>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 2 }} />
      ))}
    </Stack>
  );
}

export default function ArchivePage() {
  if (!appSettings.features.archiveJobs) {
    return (
      <Typography variant="body1" color="text.secondary">
        Funcționalitatea de arhivare nu este activată.
      </Typography>
    );
  }

  return <ArchiveContent />;
}

function ArchiveContent() {
  const { user } = useAuth();
  const supabase = useSupabase();

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);

  const [companies, setCompanies] = useState<ArchivedCompany[]>([]);
  const [jobs, setJobs] = useState<ArchivedJob[]>([]);
  const [forms, setForms] = useState<ArchivedForm[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [c, j, f] = await Promise.all([
      getArchivedCompanies(supabase, user.id),
      getArchivedJobs(supabase, user.id),
      getArchivedForms(supabase, user.id),
    ]);
    setCompanies(c as ArchivedCompany[]);
    setJobs(j);
    setForms(f);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => { load(); }, [load]);

  const restoreCompany = async (id: string) => {
    await archiveCompany(supabase, id, false);
    await load();
  };

  const restoreJob = async (id: string) => {
    await archiveJob(supabase, id, false);
    await load();
  };

  const restoreForm = async (id: string) => {
    await archiveForm(supabase, id, false);
    await load();
  };

  return (
    <>
      <DashboardPageHeader
        title={<Typography variant="h3">Arhivă</Typography>}
        subtitle={
          <Typography variant="body2" color="text.secondary">
            Elementele arhivate nu apar în paginile principale ale dashboard-ului.
          </Typography>
        }
      />

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab
          label={
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <BusinessIcon fontSize="small" />
              <span>Companii</span>
              {companies.length > 0 && (
                <Chip label={companies.length} size="small" sx={{ height: 18, fontSize: "0.65rem" }} />
              )}
            </Stack>
          }
        />
        <Tab
          label={
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <WorkOutlineIcon fontSize="small" />
              <span>Anunțuri</span>
              {jobs.length > 0 && (
                <Chip label={jobs.length} size="small" sx={{ height: 18, fontSize: "0.65rem" }} />
              )}
            </Stack>
          }
        />
        <Tab
          label={
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <ArticleOutlinedIcon fontSize="small" />
              <span>Formulare</span>
              {forms.length > 0 && (
                <Chip label={forms.length} size="small" sx={{ height: 18, fontSize: "0.65rem" }} />
              )}
            </Stack>
          }
        />
      </Tabs>

      {/* ── Companies tab ──────────────────────────────────────────────────── */}
      {tab === 0 && (
        loading ? <RowSkeleton /> :
        companies.length === 0 ? <EmptyArchive label="anunț" /> : (
          <Stack spacing={1.5}>
            {companies.map((company) => (
              <Paper
                key={company.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 3,
                  py: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <BusinessIcon sx={{ color: "text.secondary", flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={700} noWrap>
                    {company.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Arhivat {company.archived_at ? formatDate(company.archived_at) : "—"}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<UnarchiveIcon />}
                  onClick={() => restoreCompany(company.id)}
                  sx={{ flexShrink: 0 }}
                >
                  Restaurează
                </Button>
              </Paper>
            ))}
          </Stack>
        )
      )}

      {/* ── Jobs tab ───────────────────────────────────────────────────────── */}
      {tab === 1 && (
        loading ? <RowSkeleton /> :
        jobs.length === 0 ? <EmptyArchive label="anunț" /> : (
          <Stack spacing={1.5}>
            {jobs.map((job) => (
              <Paper
                key={job.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 3,
                  py: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <WorkOutlineIcon sx={{ color: "text.secondary", flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>
                      {job.title}
                    </Typography>
                    <Chip
                      label={jobStatusLabels[job.status] ?? job.status}
                      size="small"
                      color={jobStatusColor[job.status] ?? "default"}
                      sx={{ height: 20, fontSize: "0.68rem" }}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {job.companies?.name ?? "—"} • Arhivat {job.archived_at ? formatDate(job.archived_at) : "—"}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<UnarchiveIcon />}
                  onClick={() => restoreJob(job.id)}
                  sx={{ flexShrink: 0 }}
                >
                  Restaurează
                </Button>
              </Paper>
            ))}
          </Stack>
        )
      )}

      {/* ── Forms tab ──────────────────────────────────────────────────────── */}
      {tab === 2 && (
        loading ? <RowSkeleton /> :
        forms.length === 0 ? <EmptyArchive label="formular" /> : (
          <Stack spacing={1.5}>
            {forms.map((form) => (
              <Paper
                key={form.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 3,
                  py: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <ArticleOutlinedIcon sx={{ color: "text.secondary", flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>
                      {form.name}
                    </Typography>
                    <Chip
                      label={form.status}
                      size="small"
                      color={form.status === "published" ? "success" : "warning"}
                      sx={{ height: 20, fontSize: "0.68rem" }}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Arhivat {form.archived_at ? formatDate(form.archived_at) : "—"}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<UnarchiveIcon />}
                  onClick={() => restoreForm(form.id)}
                  sx={{ flexShrink: 0 }}
                >
                  Restaurează
                </Button>
              </Paper>
            ))}
          </Stack>
        )
      )}
    </>
  );
}
