"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { useSupabase } from "@/hooks/useSupabase";
import {
  getJobApplications,
  updateApplicationStatus,
  type JobApplicationWithProfile,
} from "@/services/applications.service";
import { formatDate, parseSupabaseError } from "@/lib/utils";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import type { Database, Json, Tables } from "@/types/database";

type ApplicationStatus = Database["public"]["Enums"]["application_status"];

type ApplicationRow = JobApplicationWithProfile;

type JobWithCompany = Tables<"job_listings"> & {
  companies: Tables<"companies"> | null;
};

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: "În așteptare",
  reviewed: "Evaluat",
  shortlisted: "Preselectat",
  rejected: "Respins",
  withdrawn: "Retrasă",
};

const STATUS_COLOR: Record<
  ApplicationStatus,
  "default" | "warning" | "info" | "success" | "error"
> = {
  pending: "warning",
  reviewed: "info",
  shortlisted: "success",
  rejected: "error",
  withdrawn: "default",
};

const STATUS_ORDER: Record<ApplicationStatus, number> = {
  pending: 0,
  reviewed: 1,
  shortlisted: 2,
  rejected: 3,
  withdrawn: 4,
};

type SortKey = "name" | "applied_at" | "status";
type SortDir = "asc" | "desc";

const readFromFormData = (raw: Json | null, keys: string[]): string => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "";
  const entries = Object.entries(raw as Record<string, unknown>);
  for (const target of keys) {
    const found = entries.find(([k]) => k.toLowerCase().includes(target));
    if (found && found[1] != null && String(found[1]).trim() !== "") {
      return String(found[1]);
    }
  }
  return "";
};

const candidateName = (app: ApplicationRow): string => {
  const fromProfile = app.profiles?.full_name?.trim();
  if (fromProfile) return fromProfile;
  const fromForm = readFromFormData(app.form_data, ["nume", "name"]);
  return fromForm || "Candidat anonim";
};

const candidateEmail = (app: ApplicationRow): string =>
  readFromFormData(app.form_data, ["email", "mail"]);

export function CandidatesClient() {
  const { id: jobId } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useSupabase();

  const [job, setJob] = useState<JobWithCompany | null>(null);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">(
    "all"
  );
  const [sortKey, setSortKey] = useState<SortKey>("applied_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: jobData, error: jobError } = await supabase
        .from("job_listings")
        .select("*, companies(*)")
        .eq("id", jobId)
        .maybeSingle();
      if (jobError) throw jobError;
      setJob(jobData as JobWithCompany | null);

      const data = await getJobApplications(supabase, jobId);
      setApplications(data);
    } catch (err) {
      setError(parseSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, [supabase, jobId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleStatusChange = async (
    id: string,
    status: ApplicationStatus
  ): Promise<void> => {
    const previous = applications;
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
    try {
      await updateApplicationStatus(supabase, id, status);

      if (status === "rejected") {
        void supabase.functions
          .invoke("application-rejected", {
            body: { application_id: id },
          })
          .catch((err: unknown) =>
            console.warn("application-rejected notification:", err)
          );
      }
    } catch (err) {
      setApplications(previous);
      setError(parseSupabaseError(err));
    }
  };

  const toggleSort = (key: SortKey): void => {
    if (key === sortKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "applied_at" ? "desc" : "asc");
    }
  };

  const counts = useMemo(() => {
    const base: Record<ApplicationStatus | "all", number> = {
      all: applications.length,
      pending: 0,
      reviewed: 0,
      shortlisted: 0,
      rejected: 0,
      withdrawn: 0,
    };
    for (const a of applications) base[a.status] += 1;
    return base;
  }, [applications]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = applications.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!q) return true;
      const name = candidateName(a).toLowerCase();
      const email = candidateEmail(a).toLowerCase();
      const headline = (a.profiles?.headline ?? "").toLowerCase();
      return name.includes(q) || email.includes(q) || headline.includes(q);
    });

    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      if (sortKey === "name") {
        return candidateName(a).localeCompare(candidateName(b), "ro") * dir;
      }
      if (sortKey === "status") {
        return (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) * dir;
      }
      return (
        (new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime()) *
        dir
      );
    });
    return rows;
  }, [applications, search, statusFilter, sortKey, sortDir]);

  const exportCsv = (): void => {
    if (filtered.length === 0) return;
    const headers = ["Nume", "Email", "Headline", "Status", "Aplicat", "CV"];
    const rows = filtered.map((a) => [
      candidateName(a),
      candidateEmail(a),
      a.profiles?.headline ?? "",
      STATUS_LABEL[a.status],
      formatDate(a.applied_at),
      a.cv_url ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `candidati-${job?.slug ?? jobId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = search !== "" || statusFilter !== "all";

  return (
    <Stack spacing={3}>
      <DashboardPageHeader
        alignTop
        title={
          <Stack spacing={0.5}>
            <Button
              onClick={() => router.push("/dashboard/jobs")}
              startIcon={<ArrowBackIcon />}
              size="small"
              sx={{ alignSelf: "flex-start", mb: 0.5 }}
            >
              Înapoi la anunțuri
            </Button>
            {loading ? (
              <Skeleton variant="text" width={280} height={32} />
            ) : (
              <Typography variant="h5" fontWeight={700}>
                {job?.title ?? "Candidați"}
              </Typography>
            )}
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              flexWrap="wrap"
            >
              {job?.companies?.name && (
                <Typography variant="body2" color="text.secondary">
                  {job.companies.name}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                • {counts.all}{" "}
                {counts.all === 1 ? "candidat" : "candidați"}
              </Typography>
            </Stack>
          </Stack>
        }
        actions={
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportCsv}
            disabled={filtered.length === 0 || loading}
            size="small"
          >
            Export CSV
          </Button>
        }
      />

      <Paper
        sx={{
          p: 2,
          border: "1px solid rgba(3, 23, 12, 0.1)",
          borderRadius: 2,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "flex-end" }}
        >
          <TextField
            size="small"
            placeholder="Caută după nume, email sau headline..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            inputProps={{ "aria-label": "Caută candidat" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    fontSize="small"
                    sx={{ color: "text.secondary" }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="candidate-status-filter-label">Status</InputLabel>
            <Select
              labelId="candidate-status-filter-label"
              value={statusFilter}
              label="Status"
              onChange={(e) =>
                setStatusFilter(e.target.value as ApplicationStatus | "all")
              }
            >
              <MenuItem value="all">Toate ({counts.all})</MenuItem>
              <MenuItem value="pending">
                {STATUS_LABEL.pending} ({counts.pending})
              </MenuItem>
              <MenuItem value="reviewed">
                {STATUS_LABEL.reviewed} ({counts.reviewed})
              </MenuItem>
              <MenuItem value="shortlisted">
                {STATUS_LABEL.shortlisted} ({counts.shortlisted})
              </MenuItem>
              <MenuItem value="rejected">
                {STATUS_LABEL.rejected} ({counts.rejected})
              </MenuItem>
              <MenuItem value="withdrawn">
                {STATUS_LABEL.withdrawn} ({counts.withdrawn})
              </MenuItem>
            </Select>
          </FormControl>
          {hasFilters && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Resetează
            </Button>
          )}
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" role="alert">
          {error}
        </Alert>
      )}

      {loading && (
        <Stack spacing={1}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={56}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Stack>
      )}

      {!loading && filtered.length === 0 && (
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            border: "1px solid rgba(3, 23, 12, 0.1)",
            borderRadius: 2,
          }}
        >
          <InboxOutlinedIcon
            sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }}
          />
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Niciun candidat
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {hasFilters
              ? "Niciun candidat nu corespunde filtrelor selectate."
              : "Acest anunț nu a primit candidaturi încă."}
          </Typography>
        </Paper>
      )}

      {!loading && filtered.length > 0 && (
        <TableContainer
          component={Paper}
          sx={{
            border: "1px solid rgba(3, 23, 12, 0.1)",
            borderRadius: 2,
            overflowX: "auto",
          }}
        >
          <Table size="small" aria-label="Tabel candidați">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortKey === "name"}
                    direction={sortKey === "name" ? sortDir : "asc"}
                    onClick={() => toggleSort("name")}
                  >
                    <Typography variant="caption" fontWeight={700}>
                      Candidat
                    </Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                  <Typography variant="caption" fontWeight={700}>
                    Headline
                  </Typography>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortKey === "applied_at"}
                    direction={sortKey === "applied_at" ? sortDir : "desc"}
                    onClick={() => toggleSort("applied_at")}
                  >
                    <Typography variant="caption" fontWeight={700}>
                      Aplicat
                    </Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortKey === "status"}
                    direction={sortKey === "status" ? sortDir : "asc"}
                    onClick={() => toggleSort("status")}
                  >
                    <Typography variant="caption" fontWeight={700}>
                      Status
                    </Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="caption" fontWeight={700}>
                    Acțiuni
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((app) => {
                const name = candidateName(app);
                const email = candidateEmail(app);
                return (
                  <TableRow key={app.id} hover>
                    <TableCell>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                      >
                        <Avatar
                          src={app.profiles?.avatar_url ?? undefined}
                          alt=""
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: "background.default",
                          }}
                        >
                          <PersonOutlineIcon
                            fontSize="small"
                            sx={{ color: "text.secondary" }}
                          />
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            noWrap
                          >
                            {name}
                          </Typography>
                          {email && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              component="a"
                              href={`mailto:${email}`}
                              sx={{
                                textDecoration: "none",
                                display: "block",
                                "&:hover": { color: "primary.main" },
                              }}
                            >
                              {email}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell
                      sx={{
                        display: { xs: "none", md: "table-cell" },
                        maxWidth: 260,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        sx={{ display: "block" }}
                      >
                        {app.profiles?.headline || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                      >
                        {formatDate(app.applied_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABEL[app.status]}
                        size="small"
                        color={STATUS_COLOR[app.status]}
                        sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                        alignItems="center"
                      >
                        {app.cv_url && (
                          <Tooltip title="Deschide CV">
                            <IconButton
                              component="a"
                              href={app.cv_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="small"
                              aria-label={`Deschide CV-ul candidatului ${name} (se deschide în tab nou)`}
                            >
                              <PictureAsPdfOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <Select
                            value={app.status}
                            onChange={(e) =>
                              void handleStatusChange(
                                app.id,
                                e.target.value as ApplicationStatus
                              )
                            }
                            disabled={app.status === "withdrawn"}
                            inputProps={{
                              "aria-label": `Schimbă statusul pentru ${name}`,
                            }}
                            sx={{ fontSize: "0.75rem" }}
                          >
                            <MenuItem value="pending">
                              {STATUS_LABEL.pending}
                            </MenuItem>
                            <MenuItem value="reviewed">
                              {STATUS_LABEL.reviewed}
                            </MenuItem>
                            <MenuItem value="shortlisted">
                              {STATUS_LABEL.shortlisted}
                            </MenuItem>
                            <MenuItem value="rejected">
                              {STATUS_LABEL.rejected}
                            </MenuItem>
                            {/* Only the candidate can withdraw their own
                                application (enforced by RLS). Rendered here so
                                the Select has a matching option when a
                                withdrawn application is shown; the control is
                                disabled in that case. */}
                            <MenuItem value="withdrawn" disabled>
                              {STATUS_LABEL.withdrawn}
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}
