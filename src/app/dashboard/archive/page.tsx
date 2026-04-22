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
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
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
import {
  getArchivedApplications,
  restoreApplication,
  type UserApplication,
} from "@/services/applications.service";
import { formatDate } from "@/lib/utils";
import type { Database, Tables } from "@/types/database";
import appSettings from "@/config/app.settings.json";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { JobTags } from "@/components/jobs/JobTags";

type ArchivedJob = Tables<"job_listings"> & { companies: Tables<"companies"> | null };
type ArchivedForm = Tables<"forms">;
type ArchivedCompany = Tables<"companies"> & { role: string };
type ApplicationStatus = Database["public"]["Enums"]["application_status"];

const applicationStatusLabel: Record<ApplicationStatus, string> = {
  pending: "În așteptare",
  reviewed: "Evaluată",
  shortlisted: "Preselectată",
  rejected: "Respinsă",
  withdrawn: "Închisă",
};

const applicationStatusColor: Record<
  ApplicationStatus,
  "default" | "warning" | "info" | "success" | "error"
> = {
  pending: "warning",
  reviewed: "info",
  shortlisted: "success",
  rejected: "error",
  withdrawn: "default",
};

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

function EmptyArchive({ title = "Niciun element arhivat", description = "Elementele pe care le arhivezi vor apărea aici." }: { title?: string; description?: string }) {
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
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
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
  const [applications, setApplications] = useState<UserApplication[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [c, j, f, a] = await Promise.all([
      getArchivedCompanies(supabase, user.id),
      getArchivedJobs(supabase, user.id),
      getArchivedForms(supabase, user.id),
      getArchivedApplications(supabase, user.id),
    ]);
    setCompanies(c as ArchivedCompany[]);
    setJobs(j);
    setForms(f);
    setApplications(a);
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

  const restoreApplicationRow = async (id: string) => {
    await restoreApplication(supabase, id);
    await load();
  };

  return (
    <>
      <DashboardPageHeader
        title={<Typography variant="h3">Arhivă</Typography>}
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
        <Tab
          label={
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <SendOutlinedIcon fontSize="small" />
              <span>Aplicații</span>
              {applications.length > 0 && (
                <Chip label={applications.length} size="small" sx={{ height: 18, fontSize: "0.65rem" }} />
              )}
            </Stack>
          }
        />
      </Tabs>

      {/* ── Companies tab ──────────────────────────────────────────────────── */}
      {tab === 0 && (
        loading ? <RowSkeleton /> :
        companies.length === 0 ? <EmptyArchive title="Nicio companie arhivată" description="Companiile pe care le arhivezi vor dispărea de pe dashboard și vor apărea aici." /> : (
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
        jobs.length === 0 ? <EmptyArchive title="Niciun anunț arhivat" description="Anunțurile pe care le arhivezi vor dispărea de pe dashboard și vor apărea aici." /> : (
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
                    <JobTags job={job} sx={{ ml: 2 }} />
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

      {/* ── Applications tab ───────────────────────────────────────────────── */}
      {tab === 3 && (
        loading ? <RowSkeleton /> :
        applications.length === 0 ? (
          <EmptyArchive
            title="Nicio aplicație arhivată"
            description="Aplicațiile pe care le arhivezi vor dispărea de pe dashboard și vor apărea aici."
          />
        ) : (
          <Stack spacing={1.5}>
            {applications.map((app) => {
              const job = app.job_listings;
              return (
                <Paper
                  key={app.id}
                  sx={{
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "center" },
                    flexDirection: { xs: "column", sm: "row" },
                    gap: { xs: 1.5, sm: 2 },
                    px: { xs: 2, sm: 3 },
                    py: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <SendOutlinedIcon sx={{ color: "text.secondary", flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ mb: 0.25 }}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Typography variant="subtitle2" fontWeight={700} noWrap>
                        {job?.title ?? "Loc de muncă șters"}
                      </Typography>
                      <Chip
                        label={applicationStatusLabel[app.status]}
                        size="small"
                        color={applicationStatusColor[app.status]}
                        sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600 }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {job?.companies?.name ?? "—"} • Aplicat {formatDate(app.applied_at)} • Arhivat{" "}
                      {app.archived_at ? formatDate(app.archived_at) : "—"}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<UnarchiveIcon />}
                    onClick={() => restoreApplicationRow(app.id)}
                    sx={{ flexShrink: 0, alignSelf: { xs: "flex-end", sm: "center" } }}
                  >
                    Restaurează
                  </Button>
                </Paper>
              );
            })}
          </Stack>
        )
      )}

      {/* ── Forms tab ──────────────────────────────────────────────────────── */}
      {tab === 2 && (
        loading ? <RowSkeleton /> :
        forms.length === 0 ? <EmptyArchive title="Niciun formular arhivat" description="Formulele pe care le arhivezi vor dispărea de pe dashboard și vor apărea aici." /> : (
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
