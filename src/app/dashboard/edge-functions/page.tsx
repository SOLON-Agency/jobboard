"use client";

import React, { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
  TextField,
  Typography,
} from "@mui/material";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { getUserCompaniesWithJobCount, type CompanyWithJobCount } from "@/services/companies.service";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import {
  sendEmailTestSchema,
  type SendEmailTestFormData,
} from "@/components/forms/validations/send-email-test.schema";

type InvokeSuccess = {
  ok: true;
  engages: number | null;
  message?: string;
};

type InvokeErrorBody = {
  error?: string;
};

type SendEmailInvokeBody = {
  ok?: boolean;
  emailsSent?: boolean;
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

  const [emailFeedback, setEmailFeedback] = useState<{
    severity: "success" | "error";
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SendEmailTestFormData>({
    resolver: zodResolver(sendEmailTestSchema),
    defaultValues: { to: "", subject: "", body: "" },
  });

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

  useEffect(() => {
    if (user?.email) {
      reset((values) => ({ ...values, to: user.email ?? "" }));
    }
  }, [user?.email, reset]);

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

  const onSendTestEmail = async (form: SendEmailTestFormData) => {
    setEmailFeedback(null);
    try {
      const { data, error } = await supabase.functions.invoke<SendEmailInvokeBody>("send-email", {
        body: {
          event: "custom_email",
          to: form.to.trim(),
          subject: form.subject.trim(),
          body: form.body.trim(),
        },
      });

      if (error) {
        const msg = extractErrorMessage(data, error.message);
        setEmailFeedback({ severity: "error", message: msg });
        return;
      }

      const payload = data as SendEmailInvokeBody | null;
      if (payload && typeof payload === "object") {
        if (typeof payload.error === "string" && payload.error.trim()) {
          setEmailFeedback({ severity: "error", message: payload.error });
          return;
        }
        if (payload.emailsSent === false) {
          setEmailFeedback({
            severity: "error",
            message:
              typeof payload.error === "string" && payload.error.trim()
                ? payload.error
                : "E-mailul nu a putut fi trimis.",
          });
          return;
        }
        if (payload.ok === true && payload.emailsSent === true) {
          setEmailFeedback({
            severity: "success",
            message: "E-mail trimis. Verifică căsuța de intrare (și spam).",
          });
          return;
        }
      }

      setEmailFeedback({
        severity: "error",
        message: "Răspuns neașteptat de la send-email. Încearcă din nou.",
      });
    } catch (e) {
      console.error(e);
      setEmailFeedback({
        severity: "error",
        message: "A apărut o eroare la trimiterea e-mailului. Încearcă din nou.",
      });
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

      <Stack spacing={3} sx={{ maxWidth: 560 }}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 3 },
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

        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
          }}
        >
          <Stack spacing={2} component="section" aria-labelledby="send-email-test-heading">
            <Stack direction="row" spacing={1} alignItems="center">
              <MailOutlineIcon color="primary" aria-hidden />
              <Typography id="send-email-test-heading" variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                send-email (Resend)
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Trimite un e-mail de test prin funcția Edge <code>send-email</code> (API Resend). Din motive de
              securitate, destinatarul trebuie să fie aceeași adresă ca cea a contului autentificat.
            </Typography>

            {!user.email ? (
              <Alert severity="warning" role="status">
                Contul tău nu are adresă de e-mail; nu poți testa trimiterea.
              </Alert>
            ) : (
              <Box
                component="form"
                noValidate
                onSubmit={handleSubmit(onSendTestEmail)}
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                <TextField
                  id="send-email-to"
                  label="Destinatar"
                  type="email"
                  autoComplete="email"
                  fullWidth
                  required
                  disabled={isSubmitting}
                  error={!!errors.to}
                  helperText={
                    errors.to?.message ??
                    `Trebuie să coincidă cu e-mailul contului tău (${user.email}).`
                  }
                  inputProps={{
                    "aria-required": true,
                    "aria-describedby": errors.to ? "send-email-to-error" : "send-email-to-hint",
                  }}
                  FormHelperTextProps={{
                    id: errors.to ? "send-email-to-error" : "send-email-to-hint",
                    ...(errors.to ? { role: "alert" as const } : {}),
                  }}
                  {...register("to")}
                />

                <TextField
                  id="send-email-subject"
                  label="Subiect"
                  fullWidth
                  required
                  disabled={isSubmitting}
                  error={!!errors.subject}
                  helperText={errors.subject?.message}
                  inputProps={{
                    "aria-required": true,
                    "aria-describedby": errors.subject ? "send-email-subject-error" : undefined,
                  }}
                  FormHelperTextProps={errors.subject ? { id: "send-email-subject-error", role: "alert" as const } : undefined}
                  {...register("subject")}
                />

                <TextField
                  id="send-email-body"
                  label="Conținut (text simplu)"
                  fullWidth
                  required
                  multiline
                  minRows={5}
                  disabled={isSubmitting}
                  error={!!errors.body}
                  helperText={errors.body?.message}
                  inputProps={{
                    "aria-required": true,
                    "aria-describedby": errors.body ? "send-email-body-error" : undefined,
                  }}
                  FormHelperTextProps={errors.body ? { id: "send-email-body-error", role: "alert" as const } : undefined}
                  {...register("body")}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={isSubmitting}
                  sx={{ minHeight: 44, alignSelf: "flex-start" }}
                >
                  {isSubmitting ? "Se salvează…" : "Trimite e-mail de test"}
                </Button>
              </Box>
            )}

            {emailFeedback ? (
              <Alert
                severity={emailFeedback.severity}
                role="status"
                onClose={() => setEmailFeedback(null)}
              >
                {emailFeedback.message}
              </Alert>
            ) : null}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
