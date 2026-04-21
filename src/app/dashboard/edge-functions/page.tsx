"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import DataObjectIcon from "@mui/icons-material/DataObject";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { getUserCompaniesWithJobCount, type CompanyWithJobCount } from "@/services/companies.service";
import { getUserApplications } from "@/services/applications.service";
import type { Tables } from "@/types/database";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";

type IdSource = "list" | "manual";

function formatInvokeResult(data: unknown, error: Error | null): string {
  if (error) {
    return JSON.stringify({ error: error.message, data }, null, 2);
  }
  try {
    return JSON.stringify(data ?? null, null, 2);
  } catch {
    return String(data);
  }
}

const SEND_EMAIL_EVENT_OPTIONS = [
  { value: "profile_updated", label: "profile_updated" },
  { value: "company_created", label: "company_created" },
  { value: "custom_email", label: "custom_email" },
] as const;

type SendEmailEventValue = (typeof SEND_EMAIL_EVENT_OPTIONS)[number]["value"];

const NOTIFICATION_CHANNEL_OPTIONS = [
  { value: "email", label: "email" },
  { value: "sms", label: "sms" },
] as const;

type NotificationPayloadMode = "html" | "template";

type ApplicationWithJob = Tables<"applications"> & {
  job_listings: Tables<"job_listings"> | null;
};

export default function EdgeFunctionsTestPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useSupabase();

  const [companies, setCompanies] = useState<CompanyWithJobCount[]>([]);
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [engCompanySource, setEngCompanySource] = useState<IdSource>("list");
  const [engCompanyId, setEngCompanyId] = useState("");
  const [engManualCompanyId, setEngManualCompanyId] = useState("");
  const [engPending, setEngPending] = useState(false);
  const [engResult, setEngResult] = useState<string | null>(null);
  const [engSeverity, setEngSeverity] = useState<"success" | "error">("success");

  const [jobAppSource, setJobAppSource] = useState<IdSource>("list");
  const [jobAppJobId, setJobAppJobId] = useState("");
  const [jobAppManualJobId, setJobAppManualJobId] = useState("");
  const [jobAppPending, setJobAppPending] = useState(false);
  const [jobAppResult, setJobAppResult] = useState<string | null>(null);
  const [jobAppSeverity, setJobAppSeverity] = useState<"success" | "error">("success");

  const [notifRecipientSource, setNotifRecipientSource] = useState<"self" | "manual">("self");
  const [notifRecipientManual, setNotifRecipientManual] = useState("");
  const [notifChannel, setNotifChannel] = useState<"email" | "sms">("email");
  const [notifPayloadMode, setNotifPayloadMode] = useState<NotificationPayloadMode>("html");
  const [notifSubject, setNotifSubject] = useState("Test LegalJobs");
  const [notifBody, setNotifBody] = useState("<p>Mesaj de test din dashboard.</p>");
  const [notifTemplateId, setNotifTemplateId] = useState("job-candidat");
  const [notifTemplateVarsJson, setNotifTemplateVarsJson] = useState(
    '{\n  "JOB_TITLE": "Test",\n  "job_name": "Test",\n  "COMPANY_NAME": "Demo SRL",\n  "APPLICANT_NAME": "Tu",\n  "POSTER_NAME": "HR",\n  "JOB_URL": "https://example.com/jobs/x",\n  "SITE_URL": "https://example.com"\n}',
  );
  const [notifIdempotencyKey, setNotifIdempotencyKey] = useState("");
  const [notifPending, setNotifPending] = useState(false);
  const [notifResult, setNotifResult] = useState<string | null>(null);
  const [notifSeverity, setNotifSeverity] = useState<"success" | "error">("success");

  const [sendEvent, setSendEvent] = useState<SendEmailEventValue>("custom_email");
  const [sendCompanySource, setSendCompanySource] = useState<IdSource>("list");
  const [sendCompanyId, setSendCompanyId] = useState("");
  const [sendManualCompanyId, setSendManualCompanyId] = useState("");
  const [sendTo, setSendTo] = useState("");
  const [sendSubject, setSendSubject] = useState("Test");
  const [sendBody, setSendBody] = useState("Mesaj de test send-email.");
  const [sendPending, setSendPending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [sendSeverity, setSendSeverity] = useState<"success" | "error">("success");

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoadingData(true);
    try {
      const [coRows, apps] = await Promise.all([
        getUserCompaniesWithJobCount(supabase, user.id, true),
        getUserApplications(supabase, user.id).catch(() => [] as ApplicationWithJob[]),
      ]);
      setCompanies(coRows);
      setApplications(apps);
      setEngCompanyId((prev) => {
        if (prev && coRows.some((c) => c.id === prev)) return prev;
        return coRows[0]?.id ?? "";
      });
      setSendCompanyId((prev) => {
        if (prev && coRows.some((c) => c.id === prev)) return prev;
        return coRows[0]?.id ?? "";
      });
      setJobAppJobId((prev) => {
        const ids = apps.map((a) => a.job_id).filter(Boolean);
        if (prev && ids.includes(prev)) return prev;
        return ids[0] ?? "";
      });
    } catch (e) {
      console.error(e);
      setCompanies([]);
      setApplications([]);
    } finally {
      setLoadingData(false);
    }
  }, [supabase, user?.id]);

  useEffect(() => {
    if (!authLoading && user?.id) void loadData();
  }, [authLoading, user?.id, loadData]);

  useEffect(() => {
    if (user?.email) setSendTo(user.email);
  }, [user?.email]);

  const resolvedEngCompanyId =
    engCompanySource === "list" ? engCompanyId : engManualCompanyId.trim();
  const resolvedJobId = jobAppSource === "list" ? jobAppJobId : jobAppManualJobId.trim();
  const resolvedSendCompanyId =
    sendCompanySource === "list" ? sendCompanyId : sendManualCompanyId.trim();

  const handleIncreaseEngagement = async () => {
    if (!resolvedEngCompanyId) {
      setEngSeverity("error");
      setEngResult("Introdu sau selectează un company_id.");
      return;
    }
    setEngPending(true);
    setEngResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("increase_company_engagement", {
        body: { company_id: resolvedEngCompanyId },
      });
      if (error) {
        setEngSeverity("error");
        setEngResult(formatInvokeResult(data, error));
        return;
      }
      setEngSeverity("success");
      setEngResult(formatInvokeResult(data, null));
    } catch (e) {
      setEngSeverity("error");
      setEngResult(formatInvokeResult(null, e instanceof Error ? e : new Error(String(e))));
    } finally {
      setEngPending(false);
    }
  };

  const handleJobApplication = async () => {
    if (!resolvedJobId) {
      setJobAppSeverity("error");
      setJobAppResult("Introdu sau selectează un job_id.");
      return;
    }
    setJobAppPending(true);
    setJobAppResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("job-application", {
        body: { job_id: resolvedJobId },
      });
      if (error) {
        setJobAppSeverity("error");
        setJobAppResult(formatInvokeResult(data, error));
        return;
      }
      setJobAppSeverity("success");
      setJobAppResult(formatInvokeResult(data, null));
    } catch (e) {
      setJobAppSeverity("error");
      setJobAppResult(formatInvokeResult(null, e instanceof Error ? e : new Error(String(e))));
    } finally {
      setJobAppPending(false);
    }
  };

  const handleNotifications = async () => {
    const recipient =
      notifRecipientSource === "self" ? user?.id ?? "" : notifRecipientManual.trim();
    if (!recipient) {
      setNotifSeverity("error");
      setNotifResult("Recipient lipsă (cont sau UUID manual).");
      return;
    }

    let bodyPayload: Record<string, unknown> = {
      recipient,
      channel: notifChannel,
      subject: notifSubject.trim() || undefined,
    };

    if (notifPayloadMode === "html") {
      if (!notifBody.trim()) {
        setNotifSeverity("error");
        setNotifResult("Body HTML este obligatoriu pentru modul HTML.");
        return;
      }
      bodyPayload = { ...bodyPayload, body: notifBody };
    } else {
      const variables: Record<string, string | number> = {};
      try {
        const parsed = JSON.parse(notifTemplateVarsJson) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("variables trebuie să fie un obiect JSON.");
        }
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
          if (typeof v === "number") variables[k] = v;
          else if (typeof v === "string") variables[k] = v;
          else variables[k] = String(v);
        }
      } catch (e) {
        setNotifSeverity("error");
        setNotifResult(
          e instanceof Error ? e.message : "JSON invalid pentru variabilele template-ului.",
        );
        return;
      }
      const tid = notifTemplateId.trim();
      if (!tid) {
        setNotifSeverity("error");
        setNotifResult("ID template obligatoriu.");
        return;
      }
      bodyPayload = {
        ...bodyPayload,
        resend_template: { id: tid, variables },
      };
    }

    const idem = notifIdempotencyKey.trim();
    if (idem) bodyPayload.idempotency_key = idem;

    setNotifPending(true);
    setNotifResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("notifications", {
        body: bodyPayload,
      });
      if (error) {
        setNotifSeverity("error");
        setNotifResult(formatInvokeResult(data, error));
        return;
      }
      const payload = data as { ok?: boolean; sent?: boolean; error?: string; skipped?: string } | null;
      if (payload && payload.ok === false) {
        setNotifSeverity("error");
        setNotifResult(formatInvokeResult(data, null));
        return;
      }
      setNotifSeverity("success");
      setNotifResult(formatInvokeResult(data, null));
    } catch (e) {
      setNotifSeverity("error");
      setNotifResult(formatInvokeResult(null, e instanceof Error ? e : new Error(String(e))));
    } finally {
      setNotifPending(false);
    }
  };

  const handleSendEmail = async () => {
    if (sendEvent === "company_created") {
      if (!resolvedSendCompanyId) {
        setSendSeverity("error");
        setSendResult("Selectează sau introdu company_id pentru company_created.");
        return;
      }
    }
    if (sendEvent === "custom_email") {
      if (!sendTo.trim() || !sendSubject.trim() || !sendBody.trim()) {
        setSendSeverity("error");
        setSendResult("Pentru custom_email completează destinatar, subiect și conținut.");
        return;
      }
      if (user?.email && sendTo.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
        setSendSeverity("error");
        setSendResult("Destinatarul trebuie să fie e-mailul contului autentificat.");
        return;
      }
    }

    let body: Record<string, unknown> = { event: sendEvent };
    if (sendEvent === "company_created") {
      body = { ...body, company_id: resolvedSendCompanyId };
    } else if (sendEvent === "custom_email") {
      body = {
        ...body,
        to: sendTo.trim(),
        subject: sendSubject.trim(),
        body: sendBody.trim(),
      };
    }

    setSendPending(true);
    setSendResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("send-email", { body });
      if (error) {
        setSendSeverity("error");
        setSendResult(formatInvokeResult(data, error));
        return;
      }
      const payload = data as { ok?: boolean; emailsSent?: boolean; error?: string } | null;
      if (payload?.error) {
        setSendSeverity("error");
        setSendResult(formatInvokeResult(data, null));
        return;
      }
      if (payload?.emailsSent === false) {
        setSendSeverity("error");
        setSendResult(formatInvokeResult(data, null));
        return;
      }
      setSendSeverity("success");
      setSendResult(formatInvokeResult(data, null));
    } catch (e) {
      setSendSeverity("error");
      setSendResult(formatInvokeResult(null, e instanceof Error ? e : new Error(String(e))));
    } finally {
      setSendPending(false);
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
            Apel experimental către funcții Edge (Supabase). Parametrii pot fi aleși din listă sau introduși
            manual (UUID). Răspunsul brut JSON este afișat sub fiecare acțiune.
          </Typography>
        }
      />

      {loadingData ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 2 }}>
          <CircularProgress size={24} aria-hidden />
          <Typography variant="body2">Se încarcă datele pentru teste…</Typography>
        </Box>
      ) : null}

      <Stack spacing={3} sx={{ maxWidth: 720 }}>
        {/* increase_company_engagement */}
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CloudQueueIcon color="primary" aria-hidden />
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                increase_company_engagement
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Body: <code>{"{ company_id }"}</code>. Necesită membru al companiei.
            </Typography>
            <FormLabel id="eng-company-source-label">Sursă parametru</FormLabel>
            <ToggleButtonGroup
              value={engCompanySource}
              exclusive
              onChange={(_e, v: IdSource | null) => v && setEngCompanySource(v)}
              aria-labelledby="eng-company-source-label"
              size="small"
              sx={{ alignSelf: "flex-start" }}
            >
              <ToggleButton value="list" aria-label="Companie din listă">
                Din listă
              </ToggleButton>
              <ToggleButton value="manual" aria-label="UUID manual">
                UUID manual
              </ToggleButton>
            </ToggleButtonGroup>
            {engCompanySource === "list" ? (
              companies.length === 0 ? (
                <Alert severity="warning" role="status">
                  Nu ai companii. Folosește UUID manual sau creează o companie.
                </Alert>
              ) : (
                <FormControl fullWidth>
                  <InputLabel id="eng-co-label">company_id (companie)</InputLabel>
                  <Select<string>
                    labelId="eng-co-label"
                    label="company_id (companie)"
                    value={engCompanyId}
                    onChange={(e: SelectChangeEvent<string>) => setEngCompanyId(e.target.value)}
                    disabled={engPending}
                  >
                    {companies.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name} — {c.id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )
            ) : (
              <TextField
                label="company_id (UUID)"
                value={engManualCompanyId}
                onChange={(e) => setEngManualCompanyId(e.target.value)}
                fullWidth
                disabled={engPending}
                inputProps={{ "aria-label": "company_id manual" }}
              />
            )}
            <Button
              type="button"
              variant="contained"
              size="large"
              onClick={() => void handleIncreaseEngagement()}
              disabled={engPending || !resolvedEngCompanyId}
              sx={{ minHeight: 44, alignSelf: "flex-start" }}
            >
              {engPending ? "Se trimite…" : "Invocă"}
            </Button>
            {engResult ? (
              <Alert severity={engSeverity} role="status" onClose={() => setEngResult(null)}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Răspuns
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 1,
                    bgcolor: "action.hover",
                    borderRadius: 1,
                    fontSize: "0.75rem",
                    overflow: "auto",
                    maxHeight: 240,
                  }}
                >
                  {engResult}
                </Box>
              </Alert>
            ) : null}
          </Stack>
        </Paper>

        {/* job-application */}
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <WorkOutlineIcon color="primary" aria-hidden />
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                job-application
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Body: <code>{"{ job_id }"}</code>. Necesită candidatură existentă pentru acel job.
            </Typography>
            <FormLabel id="job-app-source-label">Sursă parametru</FormLabel>
            <ToggleButtonGroup
              value={jobAppSource}
              exclusive
              onChange={(_e, v: IdSource | null) => v && setJobAppSource(v)}
              aria-labelledby="job-app-source-label"
              size="small"
              sx={{ alignSelf: "flex-start" }}
            >
              <ToggleButton value="list" aria-label="Job din candidaturile mele">
                Din candidaturi
              </ToggleButton>
              <ToggleButton value="manual" aria-label="job_id manual">
                UUID manual
              </ToggleButton>
            </ToggleButtonGroup>
            {jobAppSource === "list" ? (
              applications.length === 0 ? (
                <Alert severity="warning" role="status">
                  Nu ai candidaturi. Aplică la un job sau folosește UUID manual.
                </Alert>
              ) : (
                <FormControl fullWidth>
                  <InputLabel id="job-app-label">job_id</InputLabel>
                  <Select<string>
                    labelId="job-app-label"
                    label="job_id"
                    value={jobAppJobId}
                    onChange={(e: SelectChangeEvent<string>) => setJobAppJobId(e.target.value)}
                    disabled={jobAppPending}
                  >
                    {applications.map((a) => (
                      <MenuItem key={a.job_id} value={a.job_id}>
                        {(a.job_listings?.title ?? "Anunț") + ` — ${a.job_id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )
            ) : (
              <TextField
                label="job_id (UUID)"
                value={jobAppManualJobId}
                onChange={(e) => setJobAppManualJobId(e.target.value)}
                fullWidth
                disabled={jobAppPending}
              />
            )}
            <Button
              type="button"
              variant="contained"
              size="large"
              onClick={() => void handleJobApplication()}
              disabled={jobAppPending || !resolvedJobId}
              sx={{ minHeight: 44, alignSelf: "flex-start" }}
            >
              {jobAppPending ? "Se trimite…" : "Invocă"}
            </Button>
            {jobAppResult ? (
              <Alert severity={jobAppSeverity} role="status" onClose={() => setJobAppResult(null)}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Răspuns
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 1,
                    bgcolor: "action.hover",
                    borderRadius: 1,
                    fontSize: "0.75rem",
                    overflow: "auto",
                    maxHeight: 320,
                  }}
                >
                  {jobAppResult}
                </Box>
              </Alert>
            ) : null}
          </Stack>
        </Paper>

        {/* notifications */}
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <NotificationsActiveIcon color="primary" aria-hidden />
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                notifications
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Destinatarul este un user id. Mod HTML sau template Resend (variabile JSON).
            </Typography>
            <FormLabel id="notif-recipient-label">Recipient</FormLabel>
            <ToggleButtonGroup
              value={notifRecipientSource}
              exclusive
              onChange={(_e, v: "self" | "manual" | null) => v && setNotifRecipientSource(v)}
              aria-labelledby="notif-recipient-label"
              size="small"
              sx={{ alignSelf: "flex-start" }}
            >
              <ToggleButton value="self" aria-label="Utilizator curent">
                Contul meu ({user.id.slice(0, 8)}…)
              </ToggleButton>
              <ToggleButton value="manual" aria-label="UUID manual">
                UUID manual
              </ToggleButton>
            </ToggleButtonGroup>
            {notifRecipientSource === "manual" ? (
              <TextField
                label="recipient (user UUID)"
                value={notifRecipientManual}
                onChange={(e) => setNotifRecipientManual(e.target.value)}
                fullWidth
                disabled={notifPending}
              />
            ) : null}
            <FormControl fullWidth sx={{ maxWidth: 280 }}>
              <InputLabel id="notif-ch-label">channel</InputLabel>
              <Select<string>
                labelId="notif-ch-label"
                label="channel"
                value={notifChannel}
                onChange={(e: SelectChangeEvent<string>) =>
                  setNotifChannel(e.target.value as "email" | "sms")
                }
                disabled={notifPending}
              >
                {NOTIFICATION_CHANNEL_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormLabel id="notif-payload-label">Tip conținut</FormLabel>
            <ToggleButtonGroup
              value={notifPayloadMode}
              exclusive
              onChange={(_e, v: NotificationPayloadMode | null) => v && setNotifPayloadMode(v)}
              aria-labelledby="notif-payload-label"
              size="small"
              sx={{ alignSelf: "flex-start" }}
            >
              <ToggleButton value="html" aria-label="Body HTML">
                HTML body
              </ToggleButton>
              <ToggleButton value="template" aria-label="Template Resend">
                Resend template
              </ToggleButton>
            </ToggleButtonGroup>
            <TextField
              label="subject (opțional pentru template dacă e setat în Resend)"
              value={notifSubject}
              onChange={(e) => setNotifSubject(e.target.value)}
              fullWidth
              disabled={notifPending}
            />
            {notifPayloadMode === "html" ? (
              <TextField
                label="body (HTML)"
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                fullWidth
                multiline
                minRows={4}
                disabled={notifPending}
              />
            ) : (
              <Stack spacing={1.5}>
                <TextField
                  label="resend_template.id"
                  value={notifTemplateId}
                  onChange={(e) => setNotifTemplateId(e.target.value)}
                  fullWidth
                  disabled={notifPending}
                />
                <TextField
                  label="resend_template.variables (JSON)"
                  value={notifTemplateVarsJson}
                  onChange={(e) => setNotifTemplateVarsJson(e.target.value)}
                  fullWidth
                  multiline
                  minRows={8}
                  disabled={notifPending}
                  InputProps={{ sx: { fontFamily: "monospace", fontSize: "0.85rem" } }}
                />
              </Stack>
            )}
            <TextField
              label="idempotency_key (opțional)"
              value={notifIdempotencyKey}
              onChange={(e) => setNotifIdempotencyKey(e.target.value)}
              fullWidth
              disabled={notifPending}
            />
            <Button
              type="button"
              variant="contained"
              size="large"
              onClick={() => void handleNotifications()}
              disabled={notifPending}
              sx={{ minHeight: 44, alignSelf: "flex-start" }}
            >
              {notifPending ? "Se trimite…" : "Invocă"}
            </Button>
            {notifResult ? (
              <Alert severity={notifSeverity} role="status" onClose={() => setNotifResult(null)}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Răspuns
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 1,
                    bgcolor: "action.hover",
                    borderRadius: 1,
                    fontSize: "0.75rem",
                    overflow: "auto",
                    maxHeight: 320,
                  }}
                >
                  {notifResult}
                </Box>
              </Alert>
            ) : null}
          </Stack>
        </Paper>

        {/* send-email */}
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <MailOutlineIcon color="primary" aria-hidden />
              <DataObjectIcon color="action" aria-hidden />
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                send-email
              </Typography>
            </Stack>
            <FormControl fullWidth sx={{ maxWidth: 360 }}>
              <InputLabel id="send-ev-label">event</InputLabel>
              <Select<string>
                labelId="send-ev-label"
                label="event"
                value={sendEvent}
                onChange={(e: SelectChangeEvent<string>) =>
                  setSendEvent(e.target.value as SendEmailEventValue)
                }
                disabled={sendPending}
              >
                {SEND_EMAIL_EVENT_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {sendEvent === "profile_updated" ? (
              <Typography variant="body2" color="text.secondary">
                Fără parametri suplimentari — folosește profilul contului autentificat.
              </Typography>
            ) : null}
            {sendEvent === "company_created" ? (
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Parametru: <code>company_id</code> — trebuie să fii membru al companiei.
                </Typography>
                <FormLabel id="send-co-src-label">Sursă company_id</FormLabel>
                <ToggleButtonGroup
                  value={sendCompanySource}
                  exclusive
                  onChange={(_e, v: IdSource | null) => v && setSendCompanySource(v)}
                  aria-labelledby="send-co-src-label"
                  size="small"
                  sx={{ alignSelf: "flex-start" }}
                >
                  <ToggleButton value="list">Din listă</ToggleButton>
                  <ToggleButton value="manual">UUID manual</ToggleButton>
                </ToggleButtonGroup>
                {sendCompanySource === "list" ? (
                  companies.length === 0 ? (
                    <Alert severity="warning">Nu ai companii — folosește UUID manual.</Alert>
                  ) : (
                    <FormControl fullWidth>
                      <InputLabel id="send-co-label">company_id</InputLabel>
                      <Select<string>
                        labelId="send-co-label"
                        label="company_id"
                        value={sendCompanyId}
                        onChange={(e: SelectChangeEvent<string>) => setSendCompanyId(e.target.value)}
                        disabled={sendPending}
                      >
                        {companies.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.name} — {c.id}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )
                ) : (
                  <TextField
                    label="company_id (UUID)"
                    value={sendManualCompanyId}
                    onChange={(e) => setSendManualCompanyId(e.target.value)}
                    fullWidth
                    disabled={sendPending}
                  />
                )}
              </Stack>
            ) : null}
            {sendEvent === "custom_email" ? (
              !user.email ? (
                <Alert severity="warning">Cont fără e-mail — nu poți testa custom_email.</Alert>
              ) : (
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    Destinatarul trebuie să fie e-mailul contului: <strong>{user.email}</strong>
                  </Typography>
                  <TextField
                    label="to"
                    type="email"
                    value={sendTo}
                    onChange={(e) => setSendTo(e.target.value)}
                    fullWidth
                    disabled={sendPending}
                  />
                  <TextField
                    label="subject"
                    value={sendSubject}
                    onChange={(e) => setSendSubject(e.target.value)}
                    fullWidth
                    disabled={sendPending}
                  />
                  <TextField
                    label="body (text simplu)"
                    value={sendBody}
                    onChange={(e) => setSendBody(e.target.value)}
                    fullWidth
                    multiline
                    minRows={4}
                    disabled={sendPending}
                  />
                </Stack>
              )
            ) : null}
            <Button
              type="button"
              variant="contained"
              size="large"
              onClick={() => void handleSendEmail()}
              disabled={
                sendPending ||
                (sendEvent === "custom_email" && !user.email) ||
                (sendEvent === "company_created" && !resolvedSendCompanyId)
              }
              sx={{ minHeight: 44, alignSelf: "flex-start" }}
            >
              {sendPending ? "Se trimite…" : "Invocă"}
            </Button>
            {sendResult ? (
              <Alert severity={sendSeverity} role="status" onClose={() => setSendResult(null)}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Răspuns
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 1,
                    bgcolor: "action.hover",
                    borderRadius: 1,
                    fontSize: "0.75rem",
                    overflow: "auto",
                    maxHeight: 320,
                  }}
                >
                  {sendResult}
                </Box>
              </Alert>
            ) : null}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
