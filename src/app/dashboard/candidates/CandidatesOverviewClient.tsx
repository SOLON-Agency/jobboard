"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import {
  getEmployerCandidates,
  updateApplicationStatus,
  type EmployerCandidate,
} from "@/services/applications.service";
import { formatDate, parseSupabaseError } from "@/lib/utils";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import type { Database } from "@/types/database";

type ApplicationStatus = Database["public"]["Enums"]["application_status"];

type SortField = "applied_at" | "full_name" | "job_title" | "status";
type SortDir = "asc" | "desc";

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: "În așteptare",
  reviewed: "Evaluat",
  shortlisted: "Preselectat",
  rejected: "Respins",
  withdrawn: "Retrasă",
};

const STATUS_COLOR: Record<
  ApplicationStatus,
  "default" | "primary" | "success" | "error" | "warning"
> = {
  pending: "default",
  reviewed: "primary",
  shortlisted: "success",
  rejected: "error",
  withdrawn: "warning",
};

const ALL_STATUSES: ApplicationStatus[] = [
  "pending",
  "reviewed",
  "shortlisted",
  "rejected",
  "withdrawn",
];

export function CandidatesOverviewClient() {
  const { user } = useAuth();
  const supabase = useSupabase();

  const [candidates, setCandidates] = useState<EmployerCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "all">("all");
  const [filterJobId, setFilterJobId] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("applied_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getEmployerCandidates(supabase, user.id);
      setCandidates(data);
    } catch (err) {
      setError(parseSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => { void load(); }, [load]);

  // Unique jobs derived from candidate list for the job filter
  const jobOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const c of candidates) {
      if (c.job_listings && !seen.has(c.job_listings.id)) {
        seen.set(c.job_listings.id, c.job_listings.title);
      }
    }
    return Array.from(seen.entries()).map(([id, title]) => ({ id, title }));
  }, [candidates]);

  const handleStatusChange = useCallback(
    async (id: string, status: ApplicationStatus) => {
      const previous = candidates;
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
      try {
        await updateApplicationStatus(supabase, id, status);
        if (status === "rejected") {
          void supabase.functions
            .invoke("application-rejected", { body: { application_id: id } })
            .catch((e: unknown) => console.warn("application-rejected:", e));
        }
      } catch (err) {
        setCandidates(previous);
        setError(parseSupabaseError(err));
      }
    },
    [supabase, candidates]
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let rows = candidates;
    if (filterStatus !== "all") rows = rows.filter((c) => c.status === filterStatus);
    if (filterJobId !== "all") rows = rows.filter((c) => c.job_listings?.id === filterJobId);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (c) =>
          (c.profiles?.full_name ?? "").toLowerCase().includes(q) ||
          (c.job_listings?.title ?? "").toLowerCase().includes(q) ||
          (c.job_listings?.companies?.name ?? "").toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => {
      let va = "";
      let vb = "";
      if (sortField === "applied_at") {
        va = a.applied_at ?? "";
        vb = b.applied_at ?? "";
      } else if (sortField === "full_name") {
        va = a.profiles?.full_name ?? "";
        vb = b.profiles?.full_name ?? "";
      } else if (sortField === "job_title") {
        va = a.job_listings?.title ?? "";
        vb = b.job_listings?.title ?? "";
      } else if (sortField === "status") {
        va = a.status ?? "";
        vb = b.status ?? "";
      }
      const cmp = va.localeCompare(vb, "ro");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [candidates, filterStatus, filterJobId, search, sortField, sortDir]);

  if (loading) {
    return (
      <>
        <DashboardPageHeader title={<Skeleton variant="text" width={200} height={40} />} />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={64} sx={{ mb: 1.5 }} />
        ))}
      </>
    );
  }

  return (
    <>
      <DashboardPageHeader
        title={<Typography variant="h3">Toți candidații</Typography>}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 3, flexWrap: "wrap" }}
        useFlexGap
      >
        <TextField
          size="small"
          placeholder="Caută candidat, post, companie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 240, flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          inputProps={{ "aria-label": "Caută candidat" }}
        />

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ApplicationStatus | "all")}
          >
            <MenuItem value="all">Toate statusurile</MenuItem>
            {ALL_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {jobOptions.length > 1 && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Post</InputLabel>
            <Select
              label="Post"
              value={filterJobId}
              onChange={(e) => setFilterJobId(e.target.value)}
            >
              <MenuItem value="all">Toate posturile</MenuItem>
              {jobOptions.map((j) => (
                <MenuItem key={j.id} value={j.id}>
                  {j.title.length > 40 ? `${j.title.slice(0, 40)}…` : j.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>

      {candidates.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: "center", border: "1px solid rgba(3, 23, 12, 0.1)", borderRadius: 2 }}>
          <PeopleAltOutlinedIcon sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
          <Typography variant="h5" sx={{ mb: 1 }}>
            Niciun candidat
          </Typography>
          <Typography color="text.secondary">
            Candidații vor apărea aici după ce aplică la anunțurile tale.
          </Typography>
        </Paper>
      ) : filtered.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", border: "1px solid rgba(3, 23, 12, 0.1)", borderRadius: 2 }}>
          <Typography color="text.secondary">
            Niciun candidat nu corespunde filtrelor selectate.
          </Typography>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ borderRadius: 2, overflowX: "auto" }}
        >
          <Table size="small" aria-label="Lista candidaților">
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell>
                  <TableSortLabel
                    active={sortField === "full_name"}
                    direction={sortField === "full_name" ? sortDir : "asc"}
                    onClick={() => handleSort("full_name")}
                  >
                    Candidat
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === "job_title"}
                    direction={sortField === "job_title" ? sortDir : "asc"}
                    onClick={() => handleSort("job_title")}
                  >
                    Post
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === "applied_at"}
                    direction={sortField === "applied_at" ? sortDir : "asc"}
                    onClick={() => handleSort("applied_at")}
                  >
                    Aplicat
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === "status"}
                    direction={sortField === "status" ? sortDir : "asc"}
                    onClick={() => handleSort("status")}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell>Acțiuni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((candidate) => (
                <TableRow
                  key={candidate.id}
                  hover
                  sx={{ "&:last-child td": { border: 0 } }}
                >
                  {/* Candidate */}
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar
                        src={candidate.profiles?.avatar_url ?? undefined}
                        sx={{ width: 32, height: 32, flexShrink: 0 }}
                        aria-hidden="true"
                      >
                        <PersonOutlineIcon fontSize="small" />
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {candidate.profiles?.full_name ?? "Candidat necunoscut"}
                        </Typography>
                        {candidate.profiles?.headline && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {candidate.profiles.headline}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </TableCell>

                  {/* Job */}
                  <TableCell>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 220 }}>
                        {candidate.job_listings?.title ?? "—"}
                      </Typography>
                      {candidate.job_listings?.companies?.name && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {candidate.job_listings.companies.name}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  {/* Date */}
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {formatDate(candidate.applied_at ?? "")}
                    </Typography>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Chip
                      label={STATUS_LABEL[candidate.status as ApplicationStatus] ?? candidate.status}
                      color={STATUS_COLOR[candidate.status as ApplicationStatus] ?? "default"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <Tooltip title="Schimbă statusul">
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <Select
                          value={candidate.status ?? "pending"}
                          disabled={candidate.status === "withdrawn"}
                          onChange={(e) =>
                            void handleStatusChange(candidate.id, e.target.value as ApplicationStatus)
                          }
                          displayEmpty
                          inputProps={{ "aria-label": `Status pentru ${candidate.profiles?.full_name ?? "candidat"}` }}
                        >
                          {ALL_STATUSES.filter((s) => s !== "withdrawn").map((s) => (
                            <MenuItem key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </MenuItem>
                          ))}
                          {/* Provides a matching option when the candidate has
                              withdrawn; recruiters cannot change this status. */}
                          <MenuItem value="withdrawn" disabled>
                            {STATUS_LABEL.withdrawn}
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Summary */}
      {filtered.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
          {filtered.length} din {candidates.length} candidat{candidates.length !== 1 ? "i" : ""}
        </Typography>
      )}
    </>
  );
}
