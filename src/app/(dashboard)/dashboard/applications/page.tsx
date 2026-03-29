"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Typography,
  Paper,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
} from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { getUserApplications } from "@/services/applications.service";
import { formatDate } from "@/lib/utils";

const statusColor: Record<string, "default" | "info" | "success" | "error"> = {
  pending: "default",
  reviewed: "info",
  shortlisted: "success",
  rejected: "error",
};

export default function ApplicationsPage() {
  const { user } = useAuth();
  const supabase = useSupabase();
  const [applications, setApplications] = useState<Awaited<ReturnType<typeof getUserApplications>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserApplications(supabase, user.id)
      .then(setApplications)
      .finally(() => setLoading(false));
  }, [user, supabase]);

  return (
    <>
      <Typography variant="h3" sx={{ mb: 3 }}>
        My Applications
      </Typography>

      {loading ? null : applications.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", border: "1px solid", borderColor: "divider" }}>
          <Typography color="text.secondary">
            You haven&apos;t applied to any jobs yet.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ border: "1px solid", borderColor: "divider" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Job</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Applied</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id} hover>
                  <TableCell>
                    <Box
                      component={Link}
                      href={`/jobs/${(app.job_listings as Record<string, unknown>)?.slug ?? ""}`}
                      sx={{ textDecoration: "none", color: "primary.main" }}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {(app.job_listings as Record<string, unknown>)?.title as string ?? "Job"}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={app.status} size="small" color={statusColor[app.status]} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{formatDate(app.applied_at)}</Typography>
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
