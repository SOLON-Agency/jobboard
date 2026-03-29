"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Box,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArchiveIcon from "@mui/icons-material/Archive";
import PublishIcon from "@mui/icons-material/Publish";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { getUserCompanies } from "@/services/companies.service";
import { createJob, updateJob, deleteJob } from "@/services/jobs.service";
import { slugify, formatDate, jobTypeLabels, experienceLevelLabels, parseSupabaseError } from "@/lib/utils";
import { EditSideDrawer } from "@/components/layout/EditSideDrawer";
import type { Tables } from "@/types/database";

const schema = z.object({
  company_id: z.string().min(1, "Please select a company"),
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().optional().or(z.literal("")),
  job_type: z.string().optional().or(z.literal("")),
  experience_level: z.string().optional().or(z.literal("")),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  is_remote: z.boolean(),
  application_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

type CompanyOption = { id: string; name: string };

const statusColor: Record<string, "default" | "success" | "warning"> = {
  draft: "warning",
  published: "success",
  archived: "default",
};

type JobWithCompany = Tables<"job_listings"> & {
  companies: Pick<Tables<"companies">, "id" | "name"> | null;
};

export default function JobsPage() {
  const { user } = useAuth();
  const supabase = useSupabase();

  const [jobs, setJobs] = useState<JobWithCompany[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobWithCompany | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    handleSubmit,
    control,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_remote: false },
  });

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
      .select("*, companies(id, name)")
      .in("company_id", opts.map((c) => c.id))
      .order("created_at", { ascending: false });

    setJobs((data as JobWithCompany[]) ?? []);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const openCreate = () => {
    setEditingJob(null);
    setMessage(null);
    reset({
      company_id: companies[0]?.id ?? "",
      title: "",
      description: "",
      location: "",
      job_type: "",
      experience_level: "",
      salary_min: "",
      salary_max: "",
      is_remote: false,
      application_url: "",
    });
    setDrawerOpen(true);
  };

  const openEdit = (job: JobWithCompany) => {
    setEditingJob(job);
    setMessage(null);
    reset({
      company_id: job.company_id,
      title: job.title,
      description: job.description ?? "",
      location: job.location ?? "",
      job_type: job.job_type ?? "",
      experience_level: job.experience_level ?? "",
      salary_min: job.salary_min?.toString() ?? "",
      salary_max: job.salary_max?.toString() ?? "",
      is_remote: job.is_remote,
      application_url: job.application_url ?? "",
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setMessage(null);
  };

  const onSubmit = useCallback(
    async (data: FormData) => {
      setMessage(null);
      try {
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
            application_url: data.application_url || null,
          });
          setMessage({ type: "success", text: "Job updated." });
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
            application_url: data.application_url || null,
            status: "draft",
          });
          setMessage({ type: "success", text: "Job created as draft." });
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
      title: `${job.title} (Copy)`,
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
    if (!confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    await deleteJob(supabase, job.id);
    await loadJobs();
  };

  if (loading) return null;

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h3">Job Listings</Typography>
        {companies.length > 0 && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New Job
          </Button>
        )}
      </Stack>

      {companies.length === 0 ? (
        <Paper sx={{ p: 4, border: "1px solid", borderColor: "divider", textAlign: "center" }}>
          <WorkOutlineIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="h5" sx={{ mb: 1 }}>No companies yet</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Create a company first to manage job listings.
          </Typography>
          <Button component={Link} href="/dashboard/company" variant="outlined">
            Create Company
          </Button>
        </Paper>
      ) : jobs.length === 0 ? (
        <Paper sx={{ p: 4, border: "1px solid", borderColor: "divider", textAlign: "center" }}>
          <WorkOutlineIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="h5" sx={{ mb: 1 }}>No job listings yet</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Create your first job listing to start attracting candidates.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Create Job
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ border: "1px solid", borderColor: "divider" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobs.map((job) => (
                <TableRow
                  key={job.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => openEdit(job)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{job.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {job.location ?? "No location"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={job.status} size="small" color={statusColor[job.status]} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{formatDate(job.created_at)}</Typography>
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <IconButton size="small" onClick={() => openEdit(job)} title="Edit">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDuplicate(job)} title="Duplicate">
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                      {job.status === "draft" && (
                        <IconButton size="small" color="success" onClick={() => handleStatusChange(job.id, "published")} title="Publish">
                          <PublishIcon fontSize="small" />
                        </IconButton>
                      )}
                      {job.status === "published" && (
                        <IconButton size="small" onClick={() => handleStatusChange(job.id, "archived")} title="Archive">
                          <ArchiveIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <EditSideDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editingJob ? `Edit: ${editingJob.title}` : "Create Job"}
        message={message}
        onMessageClose={() => setMessage(null)}
        width={540}
      >
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2.5}>
            {!editingJob && companies.length > 1 && (
              <Controller
                name="company_id"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth required error={!!errors.company_id}>
                    <InputLabel>Company</InputLabel>
                    <Select {...field} label="Company">
                      {companies.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                      ))}
                    </Select>
                    {errors.company_id && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {errors.company_id.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            )}
            <TextField
              {...register("title")}
              label="Job Title"
              fullWidth
              required
              error={!!errors.title}
              helperText={errors.title?.message}
            />
            <TextField
              {...register("description")}
              label="Description (Markdown supported)"
              fullWidth
              multiline
              rows={8}
              required
              error={!!errors.description}
              helperText={errors.description?.message}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField {...register("location")} label="Location" fullWidth />
              <Controller
                name="job_type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Job Type</InputLabel>
                    <Select {...field} label="Job Type" value={field.value ?? ""}>
                      <MenuItem value="">Not specified</MenuItem>
                      {Object.entries(jobTypeLabels).map(([val, label]) => (
                        <MenuItem key={val} value={val}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Controller
                name="experience_level"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Experience Level</InputLabel>
                    <Select {...field} label="Experience Level" value={field.value ?? ""}>
                      <MenuItem value="">Not specified</MenuItem>
                      {Object.entries(experienceLevelLabels).map(([val, label]) => (
                        <MenuItem key={val} value={val}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name="is_remote"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={field.onChange} color="primary" />}
                    label="Remote Position"
                    sx={{ mt: 1 }}
                  />
                )}
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField {...register("salary_min")} label="Min Salary" type="number" fullWidth />
              <TextField {...register("salary_max")} label="Max Salary" type="number" fullWidth />
            </Stack>
            <TextField
              {...register("application_url")}
              label="External Application URL (optional)"
              fullWidth
              error={!!errors.application_url}
              helperText={errors.application_url?.message ?? "Leave empty to use internal application form"}
            />
            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ px: 4 }}>
                {isSubmitting ? "Saving..." : editingJob ? "Update Job" : "Create Job (Draft)"}
              </Button>
              {editingJob && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleDelete(editingJob)}
                >
                  Delete
                </Button>
              )}
              <Button variant="outlined" onClick={closeDrawer}>Cancel</Button>
            </Stack>
          </Stack>
        </Box>
      </EditSideDrawer>
    </>
  );
}
