"use client";

import React, { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { AddEditCompany, type AddEditCompanyHandle, type CompanyFormData } from "@/components/forms/AddEditCompany";
import { AddEditJob, type AddEditJobHandle, type JobFormData } from "@/components/forms/AddEditJob";
import { useToast } from "@/contexts/ToastContext";
import { unclaimedCompanySchema, type UnclaimedCompanyFormData } from "@/components/forms/validations/company.schema";
import { createUnclaimedAction } from "./actions";
import type { CompanyOption } from "@/components/forms/AddEditJob";

const STEPS = ["Detalii companie", "Primul anunț", "Confirmare și trimitere"];

const defaultCompanyValues: CompanyFormData = {
  name: "",
  description: "",
  email: "",
  website: "",
  industry: "",
  size: "",
  location: "",
  founded_year: "",
};

function jobDefaultValues(companyId: string): JobFormData {
  const today = new Date().toISOString().slice(0, 10);
  const sixMonths = new Date();
  sixMonths.setMonth(sixMonths.getMonth() + 6);
  return {
    company_id: companyId,
    title: "",
    description: "",
    location: "",
    published_at: today,
    expires_at: sixMonths.toISOString().slice(0, 10),
    job_type: "",
    experience_level: [],
    salary_min: "",
    salary_max: "",
    is_remote: false,
    application_method: "none",
    application_url: "",
    form_id: "",
  };
}

export function UnclaimedNewClient() {
  const { showToast } = useToast();

  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [companyData, setCompanyData] = useState<UnclaimedCompanyFormData | null>(null);
  const [jobData, setJobData] = useState<JobFormData | null>(null);

  const [result, setResult] = useState<{
    companyName: string;
    companyEmail: string;
    claimUrl: string;
    code: string;
  } | null>(null);

  const companyRef = useRef<AddEditCompanyHandle>(null);
  const jobRef = useRef<AddEditJobHandle>(null);

  // A virtual placeholder company option used while the company hasn't been
  // persisted yet. company_id will be set to "__pending__" and is ignored.
  const pendingCompanyOption: CompanyOption[] = companyData
    ? [{ id: "__pending__", name: companyData.name }]
    : [{ id: "__pending__", name: "Compania nouă" }];

  const handleCompanySubmit = async (data: CompanyFormData) => {
    // Validate that email is provided (unclaimedCompanySchema requires it)
    const parsed = unclaimedCompanySchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Date incomplete";
      setError(firstError);
      return;
    }
    setCompanyData(parsed.data);
    setError(null);
    setActiveStep(1);
  };

  const handleJobSubmit = async (data: JobFormData) => {
    setJobData(data);
    setError(null);
    setActiveStep(2);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((s) => Math.max(0, s - 1));
  };

  const handleNextCompany = () => {
    companyRef.current?.submit();
  };

  const handleNextJob = () => {
    jobRef.current?.submit();
  };

  const handleCreate = async () => {
    if (!companyData || !jobData) return;
    setIsSubmitting(true);
    setError(null);

    const res = await createUnclaimedAction(companyData, jobData);
    setIsSubmitting(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    setResult({
      companyName: res.companyName,
      companyEmail: res.companyEmail,
      claimUrl: res.claimUrl,
      code: res.code,
    });
    setActiveStep(3);
    showToast("Compania și anunțul au fost create. Emailul de invitație a fost trimis.", "success", 6000);
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    showToast("Copiat în clipboard.", "info");
  };

  // ── Completed state ──────────────────────────────────────────────────────────

  if (activeStep === 3 && result) {
    return (
      <Paper sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
        <Stack spacing={3} alignItems="center" textAlign="center">
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 56 }} />
          <Typography variant="h5" fontWeight={700}>
            Companie creată cu succes!
          </Typography>
          <Typography color="text.secondary">
            Emailul de invitație a fost trimis la{" "}
            <strong>{result.companyEmail}</strong>. Compania{" "}
            <strong>{result.companyName}</strong> va apărea în listele publice
            imediat.
          </Typography>

          <Divider flexItem />

          <Box sx={{ textAlign: "left", width: "100%" }}>
            <Typography variant="subtitle2" gutterBottom>
              Cod de revendicare (6 cifre)
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={result.code}
                sx={{ fontFamily: "monospace", fontSize: "1.25rem", px: 1 }}
              />
              <Button
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={() => copyToClipboard(result.code)}
              >
                Copiază
              </Button>
            </Stack>
          </Box>

          <Box sx={{ textAlign: "left", width: "100%" }}>
            <Typography variant="subtitle2" gutterBottom>
              Link de revendicare (magic link)
            </Typography>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Typography
                variant="caption"
                sx={{ wordBreak: "break-all", flex: 1, fontFamily: "monospace" }}
              >
                {result.claimUrl}
              </Typography>
              <Button
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={() => copyToClipboard(result.claimUrl)}
                sx={{ flexShrink: 0 }}
              >
                Copiază
              </Button>
              <Button
                size="small"
                startIcon={<OpenInNewIcon />}
                href={result.claimUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ flexShrink: 0 }}
                aria-label="Deschide link revendicare (se deschide în tab nou)"
              >
                Deschide
              </Button>
            </Stack>
          </Box>

          <Button
            variant="contained"
            href="/dashboard/admin/unclaimed/new"
            sx={{ mt: 1 }}
          >
            Adaugă o altă companie nerevendicată
          </Button>
        </Stack>
      </Paper>
    );
  }

  // ── Wizard ───────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ maxWidth: 760, mx: "auto" }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Step 0: Company details ─────────────────────────────────────────── */}
      {activeStep === 0 && (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Detalii companie nerevendicată
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Câmpul <strong>Email companie</strong> este obligatoriu — la această
            adresă vor fi trimise notificările zilnice de revendicare.
          </Typography>
          <AddEditCompany
            ref={companyRef}
            editing={null}
            defaultValues={companyData ?? defaultCompanyValues}
            onSubmit={handleCompanySubmit}
            onCancel={() => {}}
            hideActions
          />
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button variant="contained" onClick={handleNextCompany}>
              Continuă
            </Button>
          </Stack>
        </Paper>
      )}

      {/* ── Step 1: Job details ─────────────────────────────────────────────── */}
      {activeStep === 1 && (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Primul anunț de angajare
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Anunțul va fi publicat imediat și apare în listele publice ca orice
            alt anunț.
          </Typography>
          <AddEditJob
            ref={jobRef}
            companies={pendingCompanyOption}
            editingJob={null}
            defaultValues={{
              ...jobDefaultValues("__pending__"),
              ...(jobData ?? {}),
            }}
            onSubmit={handleJobSubmit}
            onCancel={handleBack}
            hideActions
            wizardMode
          />
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
            <Button onClick={handleBack}>Înapoi</Button>
            <Button variant="contained" onClick={handleNextJob}>
              Continuă
            </Button>
          </Stack>
        </Paper>
      )}

      {/* ── Step 2: Review & send ───────────────────────────────────────────── */}
      {activeStep === 2 && companyData && jobData && (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Confirmare
          </Typography>

          <Stack spacing={2} divider={<Divider />}>
            <Box>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                Companie
              </Typography>
              <Typography fontWeight={600}>{companyData.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {companyData.email}
              </Typography>
              {companyData.location && (
                <Typography variant="body2" color="text.secondary">
                  {companyData.location}
                </Typography>
              )}
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                Anunț
              </Typography>
              <Typography fontWeight={600}>{jobData.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                Publicare: {jobData.published_at} · Expiră: {jobData.expires_at}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                Ce se întâmplă la submit
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                1. Se creează compania cu <code>is_claimed=false</code>.
              </Typography>
              <Typography variant="body2">
                2. Se creează anunțul de angajare.
              </Typography>
              <Typography variant="body2">
                3. Se generează codul de revendicare (6 cifre) și linkul magic.
              </Typography>
              <Typography variant="body2">
                4. Se trimite emailul de invitație la{" "}
                <strong>{companyData.email}</strong>.
              </Typography>
              <Typography variant="body2">
                5. De luni până sâmbătă, un email de memento va fi trimis
                automat până la revendicare.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
            <Button onClick={handleBack} disabled={isSubmitting}>
              Înapoi
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreate}
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {isSubmitting ? "Se creează..." : "Creează și trimite invitația"}
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
