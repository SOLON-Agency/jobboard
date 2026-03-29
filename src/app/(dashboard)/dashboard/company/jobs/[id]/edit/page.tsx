"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Alert,
  Box,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSupabase } from "@/hooks/useSupabase";
import { updateJob, deleteJob } from "@/services/jobs.service";
import { slugify, jobTypeLabels, experienceLevelLabels } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  location: z.string().optional().or(z.literal("")),
  job_type: z.string().optional().or(z.literal("")),
  experience_level: z.string().optional().or(z.literal("")),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  is_remote: z.boolean(),
  application_url: z.string().url().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = useSupabase();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("job_listings")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        reset({
          title: data.title,
          description: data.description ?? "",
          location: data.location ?? "",
          job_type: data.job_type ?? "",
          experience_level: data.experience_level ?? "",
          salary_min: data.salary_min?.toString() ?? "",
          salary_max: data.salary_max?.toString() ?? "",
          is_remote: data.is_remote,
          application_url: data.application_url ?? "",
        });
      }
    };
    load();
  }, [supabase, id, reset]);

  const onSubmit = useCallback(
    async (data: FormData) => {
      setError(null);
      setSuccess(false);
      try {
        await updateJob(supabase, id, {
          title: data.title,
          slug: `${slugify(data.title)}-${id.slice(0, 8)}`,
          description: data.description,
          location: data.location || null,
          job_type: data.job_type || null,
          experience_level: data.experience_level || null,
          salary_min: data.salary_min ? Number(data.salary_min) : null,
          salary_max: data.salary_max ? Number(data.salary_max) : null,
          is_remote: data.is_remote,
          application_url: data.application_url || null,
        });
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update.");
      }
    },
    [supabase, id]
  );

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    await deleteJob(supabase, id);
    router.push("/dashboard/company/jobs");
  };

  return (
    <>
      <Typography variant="h3" sx={{ mb: 3 }}>
        Edit Job
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>Job updated successfully.</Alert>}

      <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2.5}>
            <TextField {...register("title")} label="Job Title" fullWidth error={!!errors.title} helperText={errors.title?.message} />
            <TextField {...register("description")} label="Description (Markdown)" fullWidth multiline rows={10} error={!!errors.description} helperText={errors.description?.message} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField {...register("location")} label="Location" fullWidth />
              <Controller name="job_type" control={control} render={({ field }) => (
                <FormControl fullWidth><InputLabel>Job Type</InputLabel>
                  <Select {...field} label="Job Type" value={field.value ?? ""}>
                    <MenuItem value="">Not specified</MenuItem>
                    {Object.entries(jobTypeLabels).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                  </Select>
                </FormControl>
              )} />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Controller name="experience_level" control={control} render={({ field }) => (
                <FormControl fullWidth><InputLabel>Experience</InputLabel>
                  <Select {...field} label="Experience" value={field.value ?? ""}>
                    <MenuItem value="">Not specified</MenuItem>
                    {Object.entries(experienceLevelLabels).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                  </Select>
                </FormControl>
              )} />
              <Controller name="is_remote" control={control} render={({ field }) => (
                <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} color="primary" />} label="Remote" sx={{ mt: 1 }} />
              )} />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField {...register("salary_min")} label="Min Salary" type="number" fullWidth />
              <TextField {...register("salary_max")} label="Max Salary" type="number" fullWidth />
            </Stack>
            <TextField {...register("application_url")} label="External Application URL" fullWidth error={!!errors.application_url} helperText={errors.application_url?.message} />
            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
              <Button variant="outlined" color="error" onClick={handleDelete}>Delete Job</Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </>
  );
}
