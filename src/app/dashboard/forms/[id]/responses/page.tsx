"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  Collapse,
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
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DownloadIcon from "@mui/icons-material/Download";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import { useSupabase } from "@/hooks/useSupabase";
import {
  getFormWithFields,
  getFormResponses,
  deleteFormResponse,
  type FormResponseWithValues,
} from "@/services/forms.service";
import { formatDate, parseSupabaseError } from "@/lib/utils";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import type { Tables } from "@/types/database";

type FormWithFields = Tables<"forms"> & { form_fields: Tables<"form_fields">[] };

export default function FormResponsesPage() {
  const { id: formId } = useParams<{ id: string }>();
  const supabase = useSupabase();

  const [form, setForm] = useState<FormWithFields | null>(null);
  const [responses, setResponses] = useState<FormResponseWithValues[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Jobs that use this form (for the filter dropdown)
  const [linkedJobs, setLinkedJobs] = useState<{ id: string; title: string }[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [jobId, setJobId] = useState("");

  // Row expansion
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  useEffect(() => {
    supabase
      .from("job_listings")
      .select("id, title")
      .eq("application_form_id", formId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setLinkedJobs(data ?? []));
  }, [supabase, formId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [formData, responsesData] = await Promise.all([
        getFormWithFields(supabase, formId),
        getFormResponses(supabase, formId, {
          q: search || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          jobId: jobId || undefined,
        }),
      ]);
      setForm(formData);
      setResponses(responsesData);
    } catch (err) {
      setError(parseSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, [supabase, formId, search, dateFrom, dateTo, jobId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (response: FormResponseWithValues) => {
    if (!confirm("Ștergi acest răspuns? Acțiunea este ireversibilă.")) return;
    try {
      await deleteFormResponse(supabase, response.id);
      setResponses((prev) => prev.filter((r) => r.id !== response.id));
    } catch (err) {
      setError(parseSupabaseError(err));
    }
  };

  const exportCsv = () => {
    if (!form || responses.length === 0) return;

    const headers = ["#", "Nume", "Email", "Data", ...form.form_fields.map((f) => f.label)];
    const rows = responses.map((r, i) => {
      const valuesMap = Object.fromEntries(
        r.form_response_values.map((v) => [v.field_id, v.value ?? ""])
      );
      return [
        String(i + 1),
        r.respondent_name ?? "",
        r.respondent_email ?? "",
        formatDate(r.created_at),
        ...form.form_fields.map((f) => valuesMap[f.id] ?? ""),
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.name}-raspunsuri.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFieldValue = (response: FormResponseWithValues, fieldId: string): string => {
    const val = response.form_response_values.find((v) => v.field_id === fieldId);
    return val?.value ?? "—";
  };

  return (
    <Stack spacing={3}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <DashboardPageHeader
        alignTop
        title={
          <Stack spacing={0.5}>
            <Button
              component={Link}
              href="/dashboard/forms"
              startIcon={<ArrowBackIcon />}
              size="small"
              sx={{ alignSelf: "flex-start", mb: 0.5 }}
            >
              Înapoi la formulare
            </Button>
            {loading ? (
              <Skeleton variant="text" width={260} height={32} />
            ) : (
              <Typography variant="h5" fontWeight={700}>
                {form?.name ?? "Răspunsuri"}
              </Typography>
            )}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" color="text.secondary">
                {responses.length} {responses.length === 1 ? "răspuns" : "răspunsuri"}
              </Typography>
              {form && (
                <Chip
                  label={form.status}
                  size="small"
                  color={form.status === "published" ? "success" : "warning"}
                  sx={{ height: 20, fontSize: "0.68rem" }}
                />
              )}
            </Stack>
          </Stack>
        }
        actions={
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportCsv}
            disabled={responses.length === 0 || loading}
            size="small"
          >
            Export CSV
          </Button>
        }
      />

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-end">
          <TextField
            size="small"
            placeholder="Caută după nume sau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 200 }}
          />
          {linkedJobs.length > 1 && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Anunț</InputLabel>
              <Select
                value={jobId}
                label="Anunț"
                onChange={(e) => setJobId(e.target.value)}
              >
                <MenuItem value="">Toate anunțurile</MenuItem>
                {linkedJobs.map((j) => (
                  <MenuItem key={j.id} value={j.id}>{j.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            size="small"
            type="date"
            label="De la"
            InputLabelProps={{ shrink: true }}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            sx={{ width: 160 }}
          />
          <TextField
            size="small"
            type="date"
            label="Până la"
            InputLabelProps={{ shrink: true }}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            sx={{ width: 160 }}
          />
          {(search || dateFrom || dateTo || jobId) && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); setJobId(""); }}
            >
              Resetează filtrele
            </Button>
          )}
        </Stack>
      </Paper>

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <Paper sx={{ p: 2, bgcolor: "error.light", borderRadius: 2 }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {loading && (
        <Stack spacing={1}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!loading && responses.length === 0 && (
        <Paper
          sx={{ p: 6, textAlign: "center", border: "1px solid", borderColor: "divider", borderRadius: 2 }}
        >
          <InboxOutlinedIcon sx={{ fontSize: 52, color: "text.secondary", mb: 1.5 }} />
          <Typography variant="h6" sx={{ mb: 0.5 }}>Niciun răspuns</Typography>
          <Typography variant="body2" color="text.secondary">
            {search || dateFrom || dateTo || jobId
              ? "Niciun răspuns nu corespunde filtrelor selectate."
              : "Formularul nu a primit niciun răspuns încă."}
          </Typography>
        </Paper>
      )}

      {/* ── Responses table ───────────────────────────────────────────────── */}
      {!loading && responses.length > 0 && form && (
        <TableContainer
          component={Paper}
          sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 40 }} />
                <TableCell><Typography variant="caption" fontWeight={700}>Respondent</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={700}>Data</Typography></TableCell>
                {form.form_fields.slice(0, 3).map((f) => (
                  <TableCell key={f.id} sx={{ display: { xs: "none", md: "table-cell" } }}>
                    <Typography variant="caption" fontWeight={700} noWrap>{f.label}</Typography>
                  </TableCell>
                ))}
                <TableCell align="right" sx={{ width: 60 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {responses.map((response) => (
                <React.Fragment key={response.id}>
                  <TableRow
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => toggleExpand(response.id)}
                  >
                    <TableCell sx={{ width: 40 }}>
                      <IconButton size="small">
                        {expanded.has(response.id) ? (
                          <ExpandLessIcon fontSize="small" />
                        ) : (
                          <ExpandMoreIcon fontSize="small" />
                        )}
                      </IconButton>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {response.respondent_name || "Anonim"}
                      </Typography>
                      {response.respondent_email && (
                        <Typography variant="caption" color="text.secondary">
                          {response.respondent_email}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {formatDate(response.created_at)}
                      </Typography>
                    </TableCell>

                    {form.form_fields.slice(0, 3).map((f) => (
                      <TableCell
                        key={f.id}
                        sx={{ display: { xs: "none", md: "table-cell" }, maxWidth: 180 }}
                      >
                        <Typography variant="caption" noWrap sx={{ display: "block" }}>
                          {getFieldValue(response, f.id)}
                        </Typography>
                      </TableCell>
                    ))}

                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Șterge răspuns">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(response)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>

                  {/* ── Expanded detail row ──────────────────────────── */}
                  <TableRow>
                    <TableCell colSpan={5 + Math.min(form.form_fields.length, 3)} sx={{ p: 0 }}>
                      <Collapse in={expanded.has(response.id)} timeout="auto" unmountOnExit>
                        <Box sx={{ px: 4, py: 2, bgcolor: "action.hover" }}>
                          <Typography variant="caption" fontWeight={700} sx={{ mb: 1.5, display: "block" }}>
                            Toate răspunsurile
                          </Typography>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
                              gap: 1.5,
                            }}
                          >
                            {form.form_fields.map((field) => {
                              const raw = getFieldValue(response, field.id);
                              const isCheckbox = field.field_type === "checkbox";
                              const tags = isCheckbox && raw !== "—"
                                ? raw.split(",").map((t) => t.trim()).filter(Boolean)
                                : [];
                              return (
                                <Box key={field.id}>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: isCheckbox && tags.length > 0 ? 0.5 : 0 }}>
                                    {field.label}
                                  </Typography>
                                  {isCheckbox && tags.length > 0 ? (
                                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                      {tags.map((tag) => (
                                        tag.split("|||").map((t) => (
                                          <Chip key={t} label={t} size="small" variant="outlined" />
                                        ))
                                      ))}
                                    </Stack>
                                  ) : (
                                    <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                                      {raw}
                                    </Typography>
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}
