"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Stack,
  Typography,
} from "@mui/material";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { getUserCompaniesWithJobCount, type CompanyWithJobCount } from "@/services/companies.service";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";

type InvokeSuccess = {
  ok: true;
  engages: number | null;
  message?: string;
};

type InvokeErrorBody = {
  error?: string;
};

function extractErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "error" in data) {
    const err = (data as InvokeErrorBody).error;
    if (typeof err === "string" && err.trim()) return err;
  }
  return fallback;
}

export default function EdgeFunctionsTestPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useSupabase();

  const [companies, setCompanies] = useState<CompanyWithJobCount[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{
    severity: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const loadCompanies = useCallback(async () => {
    if (!user?.id) return;
    setLoadingList(true);
    setFeedback(null);
    try {
      const rows = await getUserCompaniesWithJobCount(supabase, user.id, true);
      setCompanies(rows);
      setSelectedId((prev) => {
        if (prev && rows.some((c) => c.id === prev)) return prev;
        return rows[0]?.id ?? "";
      });
    } catch (e) {
      console.error(e);
      setFeedback({
        severity: "error",
        message: "Nu s-au putut încărca companiile. Încearcă din nou.",
      });
      setCompanies([]);
    } finally {
      setLoadingList(false);
    }
  }, [supabase, user?.id]);

  useEffect(() => {
    if (!authLoading && user?.id) void loadCompanies();
  }, [authLoading, user?.id, loadCompanies]);

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    setSelectedId(event.target.value);
    setFeedback(null);
  };

  const handleIncreaseEngagement = async () => {
    if (!selectedId) {
      setFeedback({ severity: "error", message: "Selectează o companie." });
      return;
    }
    setPending(true);
    setFeedback(null);
    try {
      const { data, error } = await supabase.functions.invoke<InvokeSuccess | InvokeErrorBody>(
        "increase_company_engagement",
        { body: { company_id: selectedId } },
      );

      if (error) {
        const msg = extractErrorMessage(data, error.message);
        setFeedback({ severity: "error", message: msg });
        return;
      }

      const payload = data as InvokeSuccess | InvokeErrorBody | null;
      if (payload && typeof payload === "object" && "error" in payload && payload.error) {
        setFeedback({ severity: "error", message: String(payload.error) });
        return;
      }

      const ok = payload && typeof payload === "object" && "ok" in payload && payload.ok === true;
      if (!ok) {
        setFeedback({
          severity: "error",
          message: "Răspuns neașteptat de la funcție. Încearcă din nou.",
        });
        return;
      }

      const success = payload as InvokeSuccess;
      const engagesText =
        typeof success.engages === "number"
          ? `Valoare curentă engagement: ${success.engages}.`
          : "";
      const extra = success.message ? ` ${success.message}` : "";
      setFeedback({
        severity: "success",
        message: `Engagement incrementat cu succes.${engagesText ? ` ${engagesText}` : ""}${extra}`,
      });
    } catch (e) {
      console.error(e);
      setFeedback({
        severity: "error",
        message: "A apărut o eroare la apelarea funcției. Încearcă din nou.",
      });
    } finally {
      setPending(false);
    }
  };

  if (authLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress aria-label="Se încarcă" />
      </Box>
    );
  }

  if (!user) {
    return (
      <Alert severity="info" role="status">
        Trebuie să fii autentificat pentru această pagină.
      </Alert>
    );
  }

  return (
    <Box component="main">
      <DashboardPageHeader
        title={
          <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
            Test funcții Edge
          </Typography>
        }
        subtitle={
          <Typography variant="body2" color="text.secondary">
            Apel experimental către funcții Edge (Supabase). Folosește doar în medii de dezvoltare sau
            pentru verificări controlate.
          </Typography>
        }
      />

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, sm: 3 },
          maxWidth: 560,
          borderRadius: 2,
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CloudQueueIcon color="primary" aria-hidden />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              increase_company_engagement
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Incrementează contorul de engagement al companiei selectate (apel RPC în baza de date).
          </Typography>

          {loadingList ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
              <CircularProgress size={22} aria-hidden />
              <Typography variant="body2">Se încarcă companiile…</Typography>
            </Box>
          ) : companies.length === 0 ? (
            <Alert severity="warning" role="status">
              Nu ai nicio companie activă. Creează o companie din „Companiile mele” pentru a testa.
            </Alert>
          ) : (
            <FormControl fullWidth required>
              <InputLabel id="edge-fn-company-label">Companie</InputLabel>
              <Select<string>
                labelId="edge-fn-company-label"
                id="edge-fn-company"
                value={selectedId}
                label="Companie"
                onChange={handleSelectChange}
                disabled={pending}
                inputProps={{ "aria-required": true }}
              >
                {companies.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Button
            type="button"
            variant="contained"
            color="primary"
            size="large"
            onClick={() => void handleIncreaseEngagement()}
            disabled={pending || loadingList || !selectedId || companies.length === 0}
            sx={{ minHeight: 44, alignSelf: "flex-start" }}
          >
            {pending ? "Se trimite…" : "Incrementează engagement"}
          </Button>

          {feedback ? (
            <Alert severity={feedback.severity} role="status" onClose={() => setFeedback(null)}>
              {feedback.message}
            </Alert>
          ) : null}
        </Stack>
      </Paper>
    </Box>
  );
}
