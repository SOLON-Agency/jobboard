"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { getUserApplications } from "@/services/applications.service";
import { formatDate, jobTypeLabels, jobTypeChipSx } from "@/lib/utils";
import type { Tables } from "@/types/database";
import type { Json } from "@/types/database";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";

type Application = Tables<"applications"> & {
  job_listings: (Tables<"job_listings"> & { companies: Tables<"companies"> | null }) | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "În așteptare",
  reviewing: "În revizuire",
  interview: "Interviu",
  accepted: "Acceptat",
  rejected: "Respins",
};

const STATUS_COLOR: Record<string, "default" | "warning" | "info" | "success" | "error"> = {
  pending: "default",
  reviewing: "warning",
  interview: "info",
  accepted: "success",
  rejected: "error",
};

export default function ApplicationsPage() {
  const { user } = useAuth();
  const supabase = useSupabase();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user) return;
    const data = await getUserApplications(supabase, user.id);
    setApplications(data as Application[]);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => { load(); }, [load]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const formDataEntries = (raw: Json | null): [string, string][] => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    return Object.entries(raw as Record<string, unknown>).map(([k, v]) => [k, String(v ?? "")]);
  };

  return (
    <>
      <DashboardPageHeader
        title={<Typography variant="h5" fontWeight={700}>Aplicațiile mele</Typography>}
        subtitle={
          <Typography variant="body2" color="text.secondary">
            Toate candidaturile trimise de tine.
          </Typography>
        }
      />

      {/* Loading */}
      {loading && (
        <Stack spacing={1.5}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      )}

      {/* Empty state */}
      {!loading && applications.length === 0 && (
        <Paper
          sx={{ p: 6, textAlign: "center", border: "1px solid", borderColor: "divider", borderRadius: 2 }}
        >
          <SendOutlinedIcon sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
          <Typography variant="h6" sx={{ mb: 0.5 }}>Nicio aplicație</Typography>
          <Typography variant="body2" color="text.secondary">
            Nu ai trimis nicio candidatură încă. Răsfoiește locurile de muncă disponibile.
          </Typography>
        </Paper>
      )}

      {/* Applications list */}
      {!loading && applications.length > 0 && (
        <Stack spacing={1.5}>
          {applications.map((app) => {
            const job = app.job_listings;
            const isExpanded = expanded.has(app.id);
            const entries = formDataEntries(app.form_data);

            return (
              <Paper
                key={app.id}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                  "&:hover": { borderColor: "primary.main" },
                }}
              >
                {/* Summary row */}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{ px: 3, py: 2, cursor: entries.length > 0 ? "pointer" : "default" }}
                  onClick={() => entries.length > 0 && toggle(app.id)}
                >
                  <WorkOutlineIcon sx={{ color: "text.secondary", flexShrink: 0 }} />

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {job ? (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography
                          component={Link}
                          href={`/jobs/${job.slug}`}
                          variant="subtitle2"
                          fontWeight={700}
                          noWrap
                          sx={{ textDecoration: "none", color: "text.primary", "&:hover": { color: "primary.main" } }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {job.title}
                        </Typography>
                        <Box>
                          <Chip label={job.job_type} size="small" variant="outlined" />
                        </Box>
                      </Stack>

                    ) : (
                      <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                        Loc de muncă șters
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {job?.companies?.name ?? "—"} • {formatDate(app.applied_at)}{job?.location ? ` • ${job.location}` : ""} în {jobTypeLabels[job?.job_type ?? ""] ?? job?.job_type ?? "—"}
                    </Typography>
                  </Box>

                  <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
                    <Chip
                      label={STATUS_LABEL[app.status] ?? app.status}
                      size="small"
                      color={STATUS_COLOR[app.status] ?? "default"}
                      sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                    />
                    {entries.length > 0 && (
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggle(app.id); }}>
                        {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      </IconButton>
                    )}
                  </Stack>
                </Stack>

                {/* Expandable form data */}
                {entries.length > 0 && (
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box
                      sx={{
                        px: 3,
                        pb: 2.5,
                        pt: 0.5,
                        borderTop: "1px solid",
                        borderColor: "divider",
                        bgcolor: "action.hover",
                      }}
                    >
                      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: .5, mt: 1 }}>
                        Răspunsuri formular
                      </Typography>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
                          gap: 1.5,
                        }}
                      >
                        {entries.map(([label, value]) => {
                          const tags = value.includes("|||")
                            ? value.split("|||").map((t) => t.trim()).filter(Boolean)
                            : [];
                          return (
                            <Box key={label}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: tags.length > 0 ? 0.5 : 0 }}>
                                {label}
                              </Typography>
                              {tags.length > 0 ? (
                                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                  {tags.map((tag) => (
                                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                                  ))}
                                </Stack>
                              ) : (
                                <Typography variant="body2" sx={{ wordBreak: "break-word", fontWeight: 500 }}>
                                  {value || "—"}
                                </Typography>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  </Collapse>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}
    </>
  );
}
