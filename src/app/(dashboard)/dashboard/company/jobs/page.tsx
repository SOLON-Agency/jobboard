"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Typography,
  Button,
  Paper,
  Stack,
  Chip,
  IconButton,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArchiveIcon from "@mui/icons-material/Archive";
import PublishIcon from "@mui/icons-material/Publish";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { getUserCompanies } from "@/services/companies.service";
import { getCompanyJobs, updateJob, createJob } from "@/services/jobs.service";
import { slugify, formatDate } from "@/lib/utils";
import type { Tables } from "@/types/database";

const statusColor: Record<string, "default" | "success" | "warning"> = {
  draft: "warning",
  published: "success",
  archived: "default",
};

export default function CompanyJobsPage() {
  const { user } = useAuth();
  const supabase = useSupabase();
  const [jobs, setJobs] = useState<Tables<"job_listings">[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    if (!user) return;
    const companies = await getUserCompanies(supabase, user.id);
    if (companies[0]?.companies) {
      const cId = companies[0].companies.id;
      setCompanyId(cId);
      const data = await getCompanyJobs(supabase, cId);
      setJobs(data);
    }
  }, [user, supabase]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleStatusChange = async (jobId: string, status: "published" | "archived" | "draft") => {
    await updateJob(supabase, jobId, {
      status,
      published_at: status === "published" ? new Date().toISOString() : undefined,
    });
    await loadJobs();
  };

  const handleDuplicate = async (job: Tables<"job_listings">) => {
    if (!companyId) return;
    await createJob(supabase, {
      company_id: companyId,
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

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h3">Job Listings</Typography>
        {companyId && (
          <Button
            component={Link}
            href="/dashboard/company/jobs/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            New Job
          </Button>
        )}
      </Stack>

      {!companyId ? (
        <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider", textAlign: "center" }}>
          <Typography color="text.secondary">
            Create a company first to manage job listings.
          </Typography>
          <Button component={Link} href="/dashboard/company" variant="outlined" sx={{ mt: 2 }}>
            Create Company
          </Button>
        </Paper>
      ) : jobs.length === 0 ? (
        <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider", textAlign: "center" }}>
          <Typography color="text.secondary">No job listings yet.</Typography>
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
                <TableRow key={job.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {job.title}
                    </Typography>
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
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <IconButton
                        component={Link}
                        href={`/dashboard/company/jobs/${job.id}/edit`}
                        size="small"
                        title="Edit"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDuplicate(job)}
                        title="Duplicate"
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                      {job.status === "draft" && (
                        <IconButton
                          size="small"
                          onClick={() => handleStatusChange(job.id, "published")}
                          title="Publish"
                          color="success"
                        >
                          <PublishIcon fontSize="small" />
                        </IconButton>
                      )}
                      {job.status === "published" && (
                        <IconButton
                          size="small"
                          onClick={() => handleStatusChange(job.id, "archived")}
                          title="Archive"
                        >
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
    </>
  );
}
