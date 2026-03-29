"use client";

import React, { useEffect, useState, useCallback } from "react";
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
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { getUserCompanies } from "@/services/companies.service";
import { createJob } from "@/services/jobs.service";
import { slugify, jobTypeLabels, experienceLevelLabels } from "@/lib/utils";

const schema = z.object({
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

export default function NewJobPage() {
  const { user } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_remote: false },
  });

  useEffect(() => {
    if (!user) return;
    getUserCompanies(supabase, user.id).then((companies) => {
      if (companies[0]?.companies) {
        setCompanyId(companies[0].companies.id);
      }
    });
  }, [user, supabase]);

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (!companyId) return;
      setError(null);
      try {
        const slug = `${slugify(data.title)}-${Date.now().toString(36)}`;
        await createJob(supabase, {
          company_id: companyId,
          title: data.title,
          slug,
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
        router.push("/dashboard/company/jobs");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create job.");
      }
    },
    [supabase, companyId, router]
  );

  if (!companyId) {
    return (
      <Typography color="text.secondary">
        You need to create a company first.
      </Typography>
    );
  }

  return (
    <>
      <Typography variant="h3" sx={{ mb: 3 }}>
        Create New Job
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2.5}>
            <TextField
              {...register("title")}
              label="Job Title"
              fullWidth
              error={!!errors.title}
              helperText={errors.title?.message}
            />
            <TextField
              {...register("description")}
              label="Job Description (Markdown supported)"
              fullWidth
              multiline
              rows={10}
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
              <TextField {...register("salary_min")} label="Minimum Salary" type="number" fullWidth />
              <TextField {...register("salary_max")} label="Maximum Salary" type="number" fullWidth />
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
                {isSubmitting ? "Creating..." : "Create Job (Draft)"}
              </Button>
              <Button variant="outlined" onClick={() => router.back()}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </>
  );
}
