"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Typography,
  Button,
  Paper,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { getUserCompanies } from "@/services/companies.service";
import { createJob, updateJob, deleteJob } from "@/services/jobs.service";
import { slugify, parseSupabaseError } from "@/lib/utils";
import { JobList } from "@/components/jobs/JobList";
import { EditSideDrawer } from "@/components/layout/EditSideDrawer";
import { AddEditJob } from "@/components/dashboard/AddEditJob";
import type { JobFormData, CompanyOption, JobWithCompany } from "@/components/dashboard/AddEditJob";


export default function JobsPage() {
  const { user } = useAuth();
  const supabase = useSupabase();

  const [jobs, setJobs] = useState<JobWithCompany[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobWithCompany | null>(null);
  const [formDefaults, setFormDefaults] = useState<JobFormData | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadJobs = useCallback(async () => {
    if (!user) return;
    const rows = await getUserCompanies(supabase, user.id);
    const opts: CompanyOption[] = rows
      .flatMap((cu) => (cu.companies ? [{ id: cu.companies.id, name: cu.companies.name }] : []));

    setCompanies(opts);

    if (opts.length === 0) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("job_listings")
      .select("*, companies(*)")
      .in("company_id", opts.map((c) => c.id))
      .order("created_at", { ascending: false });

    setJobs((data as JobWithCompany[]) ?? []);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const openCreate = () => {
    setEditingJob(null);
    setMessage(null);
    setFormDefaults({
      company_id: companies[0]?.id ?? "",
      title: "",
      description: "",
      location: "",
      job_type: "",
      experience_level: "",
      salary_min: "",
      salary_max: "",
      is_remote: false,
      application_method: "none",
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
      experience_level: job.experience_level ?? "",
      salary_min: job.salary_min?.toString() ?? "",
      salary_max: job.salary_max?.toString() ?? "",
      is_remote: job.is_remote,
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
    async (data: JobFormData, status: "draft" | "published" = "draft") => {
      setMessage(null);
      try {
        const appUrl = data.application_method === "url" ? (data.application_url || null) : null;
        const appFormId = data.application_method === "form" ? (data.form_id || null) : null;

        if (editingJob) {
          await updateJob(supabase, editingJob.id, {
            title: data.title,
            slug: `${slugify(data.title)}-${editingJob.id.slice(0, 8)}`,
            description: data.description,
            location: data.location || null,
            job_type: data.job_type || null,
            experience_level: data.experience_level || null,
            salary_min: data.salary_min ? Number(data.salary_min) : null,
            salary_max: data.salary_max ? Number(data.salary_max) : null,
            is_remote: data.is_remote,
            application_url: appUrl,
            application_form_id: appFormId,
          });
          setMessage({ type: "success", text: "Anunț actualizat." });
        } else {
          await createJob(supabase, {
            company_id: data.company_id,
            title: data.title,
            slug: `${slugify(data.title)}-${Date.now().toString(36)}`,
            description: data.description,
            location: data.location || null,
            job_type: data.job_type || null,
            experience_level: data.experience_level || null,
            salary_min: data.salary_min ? Number(data.salary_min) : null,
            salary_max: data.salary_max ? Number(data.salary_max) : null,
            is_remote: data.is_remote,
            application_url: appUrl,
            application_form_id: appFormId,
            status,
            published_at: status === "published" ? new Date().toISOString() : null,
          });
          setMessage({
            type: "success",
            text: status === "published" ? "Anunț publicat cu succes." : "Anunț salvat ca ciornă.",
          });
        }
        await loadJobs();
        setTimeout(closeDrawer, 900);
      } catch (err) {
        setMessage({ type: "error", text: parseSupabaseError(err) });
      }
    },
    [supabase, editingJob, loadJobs]
  );

  const handleStatusChange = async (jobId: string, status: "published" | "archived" | "draft") => {
    await updateJob(supabase, jobId, {
      status,
      published_at: status === "published" ? new Date().toISOString() : undefined,
    });
    await loadJobs();
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
    await loadJobs();
  };

  const handleDelete = async (job: JobWithCompany) => {
    if (!confirm(`Ștergi "${job.title}"? Această acțiune nu poate fi anulată.`)) return;
    await deleteJob(supabase, job.id);
    await loadJobs();
  };

  if (loading) return null;

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h3">Anunțuri de muncă</Typography>
        {companies.length > 0 && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Anunț nou
          </Button>
        )}
      </Stack>

      {companies.length === 0 ? (
        <Paper sx={{ p: 4, border: "1px solid", borderColor: "divider", textAlign: "center" }}>
          <WorkOutlineIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="h5" sx={{ mb: 1 }}>Nicio companie</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Creează mai întâi o companie pentru a gestiona anunțurile de muncă.
          </Typography>
          <Button component={Link} href="/dashboard/company" variant="outlined">
            Creează companie
          </Button>
        </Paper>
      ) : jobs.length === 0 ? (
        <Paper sx={{ p: 4, border: "1px solid", borderColor: "divider", textAlign: "center" }}>
          <WorkOutlineIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="h5" sx={{ mb: 1 }}>Niciun anunț de muncă</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Creează primul tău anunț pentru a atrage candidații potriviți.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Creează anunț
          </Button>
        </Paper>
      ) : (
        <JobList
          jobs={jobs}
          onEdit={openEdit}
          onDuplicate={handleDuplicate}
          onStatusChange={handleStatusChange}
        />
      )}

      <EditSideDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editingJob ? `Editează: ${editingJob.title}` : "Creează anunț"}
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
