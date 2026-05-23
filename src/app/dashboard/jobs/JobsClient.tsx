"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  Typography,
  Button,
  Paper,
  FormControl,
  Select,
  MenuItem,
  Tooltip,
  Alert,
  type SelectChangeEvent,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { useRole } from "@/hooks/useRole";
import { MAX_ACTIVE_JOBS } from "@/lib/roles";
import { createJob, updateJob, deleteJob, archiveJob } from "@/services/jobs.service";
import { createBenefit } from "@/services/benefits.service";
import { slugify, parseSupabaseError } from "@/lib/utils";
import { JobList } from "@/components/jobs/JobList";
import { EditSideDrawer } from "@/components/layout/EditSideDrawer";
import { AddEditJob } from "@/components/forms/AddEditJob";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { useToast } from "@/contexts/ToastContext";
import type { JobFormData, JobWithCompany, BenefitDraft } from "@/components/forms/AddEditJob";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { jobBoardApi, useEmployerJobsDashboardQuery } from "@/store/jobBoardApi";
import { useAppDispatch } from "@/store/hooks";

// ─── Scheduling helpers ────────────────────────────────────────────────────────

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function todayDateInput(): string {
  return new Date().toISOString().slice(0, 10);
}

function sixMonthsFromNow(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return d.toISOString().slice(0, 10);
}

/** A published_at on or before today should go live immediately. */
function deriveStatus(publishedAtDate: string): "published" | "draft" {
  return new Date(publishedAtDate) <= new Date() ? "published" : "draft";
}

export function JobsClient() {
  const { user } = useAuth();
  const supabase = useSupabase();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { role } = useRole();
  const { showToast } = useToast();

  const {
    data: dashboardData,
    isLoading,
    isError,
    refetch,
  } = useEmployerJobsDashboardQuery(user?.id ?? skipToken);

  const jobs = useMemo(() => dashboardData?.jobs ?? [], [dashboardData?.jobs]);
  const companies = useMemo(() => dashboardData?.companies ?? [], [dashboardData?.companies]);

  const activeJobCount = jobs.filter((j) => j.status === "published").length;
  const maxJobs = MAX_ACTIVE_JOBS[role];
  const atJobLimit = maxJobs !== null && activeJobCount >= maxJobs;

  const invalidateEmployerJobs = useCallback(() => {
    if (!user?.id) return;
    dispatch(jobBoardApi.util.invalidateTags([{ type: "EmployerDashboard", id: user.id }]));
  }, [dispatch, user]);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobWithCompany | null>(null);
  const [formDefaults, setFormDefaults] = useState<JobFormData | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const openCreate = () => {
    setEditingJob(null);
    setMessage(null);
    setFormDefaults({
      company_id: companies[0]?.id ?? "",
      title: "",
      description: "",
      location: "",
      job_type: "",
      experience_level: [],
      salary_min: "",
      salary_max: "",
      is_remote: false,
      published_at: todayDateInput(),
      expires_at: sixMonthsFromNow(),
      application_method: "form",
      application_url: "",
      form_id: "",
    });
    setDrawerOpen(true);
  };

  const openEdit = (job: JobWithCompany) => {
    setEditingJob(job);
    setMessage(null);
    setFormDefaults({
      company_id: job.company_id,
      title: job.title,
      description: job.description ?? "",
      location: job.location ?? "",
      job_type: job.job_type ?? "",
      experience_level: job.experience_level ?? [],
      salary_min: job.salary_min?.toString() ?? "",
      salary_max: job.salary_max?.toString() ?? "",
      is_remote: job.is_remote,
      published_at: toDateInput(job.published_at) || todayDateInput(),
      expires_at: toDateInput(job.expires_at) || sixMonthsFromNow(),
      application_method: job.application_url
        ? "url"
        : job.application_form_id
        ? "form"
        : "none",
      application_url: job.application_url ?? "",
      form_id: job.application_form_id ?? "",
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setMessage(null);
  };

  const onSubmit = useCallback(
    async (data: JobFormData, status: "draft" | "published" = "draft", newBenefits?: BenefitDraft[]) => {
      setMessage(null);
      try {
        const appUrl = data.application_method === "url" ? (data.application_url || null) : null;
        const appFormId = data.application_method === "form" ? (data.form_id || null) : null;

        // Enforce active job limit when creating a published job
        if (!editingJob && status === "published" && atJobLimit && maxJobs !== null) {
          setMessage({
            type: "error",
            text: `Ai atins limita de ${maxJobs} anunțuri active. Arhivează un anunț sau treci la un plan superior.`,
          });
          return;
        }

        if (editingJob) {
          const companyName =
            editingJob.companies?.name ??
            companies.find((c) => c.id === editingJob.company_id)?.name ??
            "";
          const slug = companyName
            ? `${slugify(data.title)}-${slugify(companyName)}-${editingJob.id.slice(0, 8)}`
            : `${slugify(data.title)}-${editingJob.id.slice(0, 8)}`;

          const publishedAt = new Date(data.published_at).toISOString();
          const expiresAt = new Date(data.expires_at).toISOString();
          const rescheduledStatus =
            editingJob.status !== "archived"
              ? deriveStatus(data.published_at)
              : editingJob.status;

          await updateJob(supabase, editingJob.id, {
            title: data.title,
            slug,
            description: data.description,
            location: data.location || null,
            job_type: data.job_type || null,
            experience_level: data.experience_level.length > 0 ? data.experience_level : null,
            salary_min: data.salary_min ? Number(data.salary_min) : null,
            salary_max: data.salary_max ? Number(data.salary_max) : null,
            is_remote: data.is_remote,
            application_url: appUrl,
            application_form_id: appFormId,
            published_at: publishedAt,
            expires_at: expiresAt,
            status: rescheduledStatus,
          });
          setMessage({ type: "success", text: "Anunț actualizat." });
          showToast("Anunț actualizat cu succes.");
          if (user) {
            void dispatchNotification(supabase, {
              type: NOTIFICATION_TYPES.JOB_EDITED,
              recipients: [user.id],
              data: { job_title: data.title },
              idempotencyKey: `job-edited/${editingJob.id}/${Date.now()}`,
            }).catch((e: unknown) => console.warn("notify-job-edited:", e));
          }
        } else {
          const companyName = companies.find((c) => c.id === data.company_id)?.name ?? "";
          const slug = companyName
            ? `${slugify(data.title)}-${slugify(companyName)}-${Date.now().toString(36)}`
            : `${slugify(data.title)}-${Date.now().toString(36)}`;

          const publishedAt = new Date(data.published_at).toISOString();
          const expiresAt = new Date(data.expires_at).toISOString();
          const effectiveStatus =
            status === "published" ? deriveStatus(data.published_at) : "draft";

          const job = await createJob(supabase, {
            company_id: data.company_id,
            title: data.title,
            slug,
            description: data.description,
            location: data.location || null,
            job_type: data.job_type || null,
            experience_level: data.experience_level.length > 0 ? data.experience_level : null,
            salary_min: data.salary_min ? Number(data.salary_min) : null,
            salary_max: data.salary_max ? Number(data.salary_max) : null,
            is_remote: data.is_remote,
            application_url: appUrl,
            application_form_id: appFormId,
            status: effectiveStatus,
            published_at: publishedAt,
            expires_at: expiresAt,
          });
          if (newBenefits && newBenefits.length > 0) {
            await Promise.all(
              newBenefits.map((b) => createBenefit(supabase, { job_id: job.id, title: b.title, sort_order: b.sort_order }))
            );
          }
          if (effectiveStatus === "published") {
            void supabase.functions
              .invoke("company-followers-notify", {
                body: {
                  company_id: data.company_id,
                  event: "job_created",
                  job_id: job.id,
                  job_title: data.title,
                  job_slug: slug,
                },
              })
              .catch((e: unknown) => console.warn("company-followers-notify:", e));
            void supabase.functions
              .invoke("alerts-job-match", { body: { job_id: job.id } })
              .catch((e: unknown) => console.warn("alerts-job-match:", e));
          }
          const successMsg =
            effectiveStatus === "published"
              ? "Anunț publicat cu succes."
              : status === "published"
              ? "Anunț programat — va fi publicat automat la data selectată."
              : "Anunț salvat ca ciornă.";
          setMessage({ type: "success", text: successMsg });
          showToast(successMsg);
        }
        await invalidateEmployerJobs();
        setTimeout(closeDrawer, 900);
      } catch (err) {
        setMessage({ type: "error", text: parseSupabaseError(err) });
      }
    },
    [
      supabase,
      editingJob,
      companies,
      invalidateEmployerJobs,
      user,
      showToast,
      atJobLimit,
      maxJobs,
    ]
  );

  const handleStatusChange = async (jobId: string, status: "published" | "archived" | "draft") => {
    await updateJob(supabase, jobId, {
      status,
      published_at: status === "published" ? new Date().toISOString() : undefined,
    });
    if (status === "archived") showToast("Anunț arhivat.", "info");
    else if (status === "published") showToast("Anunț publicat.");
    if (status === "published") {
      const job = jobs.find((j) => j.id === jobId);
      if (job) {
        void supabase.functions
          .invoke("company-followers-notify", {
            body: {
              company_id: job.company_id,
              event: "job_created",
              job_id: job.id,
              job_title: job.title,
              job_slug: job.slug,
            },
          })
          .catch((e: unknown) => console.warn("company-followers-notify:", e));
        void supabase.functions
          .invoke("alerts-job-match", { body: { job_id: job.id } })
          .catch((e: unknown) => console.warn("alerts-job-match:", e));
      }
    }
    await invalidateEmployerJobs();
  };

  const handleDuplicate = async (job: JobWithCompany) => {
    await createJob(supabase, {
      company_id: job.company_id,
      title: `${job.title} (Copie)`,
      slug: `${job.slug}-copy-${Date.now()}`,
      description: job.description,
      location: job.location,
      job_type: job.job_type,
      experience_level: job.experience_level,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.salary_currency,
      is_remote: job.is_remote,
      application_url: job.application_url,
      status: "draft",
    });
    await invalidateEmployerJobs();
  };

  const handleDelete = async (job: JobWithCompany) => {
    if (!confirm(`Ștergi "${job.title}"? Această acțiune nu poate fi anulată.`)) return;
    await deleteJob(supabase, job.id);
    if (user) {
      void dispatchNotification(supabase, {
        type: NOTIFICATION_TYPES.JOB_DELETED,
        recipients: [user.id],
        data: { job_title: job.title },
        idempotencyKey: `job-deleted/${job.id}`,
      }).catch((e: unknown) => console.warn("notify-job-deleted:", e));
    }
    await invalidateEmployerJobs();
  };

  const handleArchive = async (job: JobWithCompany) => {
    await archiveJob(supabase, job.id, true);
    if (user) {
      void dispatchNotification(supabase, {
        type: NOTIFICATION_TYPES.JOB_ARCHIVED,
        recipients: [user.id],
        data: { job_title: job.title },
        idempotencyKey: `job-archived/${job.id}`,
      }).catch((e: unknown) => console.warn("notify-job-archived:", e));
    }
    await invalidateEmployerJobs();
  };

  const handlePreviewCandidates = (job: JobWithCompany) => {
    router.push(`/dashboard/jobs/${job.id}/candidates`);
  };

  const filteredJobs =
    selectedCompanyId === "all"
      ? jobs
      : jobs.filter((j) => j.company_id === selectedCompanyId);

  if (isLoading) return null;

  if (isError) {
    return (
      <Paper sx={{ p: 4, border: "1px solid rgba(3, 23, 12, 0.1)", borderRadius: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Nu s-au putut încărca anunțurile. Te rugăm să încerci din nou.
        </Alert>
        <Button type="button" variant="contained" onClick={() => void refetch()}>
          Reîncearcă
        </Button>
      </Paper>
    );
  }

  return (
    <>
      <DashboardPageHeader
        responsive={true}
        title={<Typography variant="h3">Anunțuri de muncă</Typography>}
        actions={
          <>
            {companies.length > 1 && (
              <FormControl size="small" sx={{ minWidth: 180, maxWidth: "100%" }}>
                <Select
                  value={selectedCompanyId}
                  onChange={(e: SelectChangeEvent) => setSelectedCompanyId(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="all">Toate companiile</MenuItem>
                  {companies.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name.slice(0, 50)}...</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {companies.length > 0 && (
              <Tooltip
                title={
                  atJobLimit
                    ? `Ai atins limita de ${maxJobs} anunț${maxJobs === 1 ? "" : "uri"} active. Arhivează un anunț sau treci la un plan superior.`
                    : ""
                }
              >
                <span>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openCreate}
                    disabled={atJobLimit}
                  >
                    Anunț nou
                  </Button>
                </span>
              </Tooltip>
            )}
          </>
        }
      />

      {companies.length === 0 ? (
        <Paper sx={{ p: 4, border: "1px solid rgba(3, 23, 12, 0.1)", borderRadius: 2, textAlign: "center" }}>
          <WorkOutlineIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="h5" sx={{ mb: 1 }}>Nicio companie</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Creează mai întâi o companie pentru a gestiona anunțurile de muncă.
          </Typography>
          <Button component={Link} href="/dashboard/company" variant="outlined">
            Creează companie
          </Button>
        </Paper>
      ) : filteredJobs.length === 0 ? (
        <Paper sx={{ p: 4, border: "1px solid rgba(3, 23, 12, 0.1)", borderRadius: 2, textAlign: "center" }}>
          <WorkOutlineIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="h5" sx={{ mb: 1 }}>
            {selectedCompanyId === "all" ? "Niciun anunț de muncă" : "Niciun anunț pentru această companie"}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {selectedCompanyId === "all"
              ? "Creează primul tău anunț pentru a atrage candidații potriviți."
              : "Adaugă un anunț nou pentru compania selectată."}
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Creează anunț de muncă
          </Button>
        </Paper>
      ) : (
        <JobList
          jobs={filteredJobs}
          onEdit={openEdit}
          onDuplicate={handleDuplicate}
          onStatusChange={handleStatusChange}
          onArchive={handleArchive}
          onPreviewCandidates={handlePreviewCandidates}
        />
      )}

      <EditSideDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editingJob ? `Editează: ${editingJob.title}` : "Creează anunț de muncă"}
        message={message}
        onMessageClose={() => setMessage(null)}
        width={540}
      >
        {formDefaults && (
          <AddEditJob
            key={editingJob?.id ?? "create"}
            companies={companies}
            editingJob={editingJob}
            defaultValues={formDefaults}
            onSubmit={onSubmit}
            onDelete={editingJob ? () => handleDelete(editingJob) : undefined}
            onCancel={closeDrawer}
          />
        )}
      </EditSideDrawer>
    </>
  );
}
