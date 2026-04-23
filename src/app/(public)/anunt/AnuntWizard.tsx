"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  AlertTitle,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";

import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";
import {
  AddEditJob,
  type AddEditJobHandle,
  type JobFormData,
  type BenefitDraft,
} from "@/components/forms/AddEditJob";
import {
  AddEditCompany,
  type AddEditCompanyHandle,
  type CompanyFormData,
} from "@/components/forms/AddEditCompany";
import { createJob } from "@/services/jobs.service";
import { createCompany, updateCompany } from "@/services/companies.service";
import { createBenefit } from "@/services/benefits.service";
import { slugify, parseSupabaseError, jobTypeLabels, experienceLevelLabels, formatSalary, formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/components/forms/validations/login.schema";
import { wizardRegisterSchema, type WizardRegisterFormData } from "@/components/forms/validations/wizard-register.schema";
import { JobTags } from "@/components/jobs/JobTags";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_LABELS = ["Anunț", "Companie", "Confirmare"];
const STEP_DESCRIPTIONS = [
  "Titlu, descriere, salariu și aplicare",
  "Informații despre compania angajatoare",
  "Revizuiește și publică anunțul",
];
const PLACEHOLDER_COMPANY_ID = "wizard-pending";
const DRAFT_STORAGE_KEY = "anunt-wizard-draft";

const LOADING_MESSAGES = [
  "Consultăm codul muncii...",
  "Redactăm contractul colectiv...",
  "Aplicăm ștampila cu stema...",
  "Verificăm clauza de confidențialitate...",
  "Notificăm ITM-ul...",
  "Calculăm sporurile salariale...",
  "Pregătim dosarul de angajare...",
  "Consultăm precedentele juridice...",
  "Obținem avizul consilierului...",
  "Înregistrăm la REGES...",
  "Semnăm contractul în fața notarului...",
  "Verificăm clauza de neconcurență...",
];

// ─── Draft persistence helpers ────────────────────────────────────────────────

type JobTagsJob = Pick<
  Tables<"job_listings">,
  "job_type" | "experience_level" | "is_remote" | "location"
>;

interface WizardDraft {
  jobData: JobFormData;
  jobBenefits: BenefitDraft[];
  companyData: CompanyFormData;
  companyLogoUrl: string | null;
}

function saveDraft(draft: WizardDraft) {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch { /* storage unavailable */ }
}

function loadDraft(): WizardDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WizardDraft;
  } catch {
    return null;
  }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_STORAGE_KEY); } catch { /* ignore */ }
}

// ─── LoginInline ──────────────────────────────────────────────────────────────

function LoginInline({ supabase, onError }: {
  supabase: SupabaseClient<Database>;
  onError: (msg: string | null) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    onError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) onError(error.message);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        <TextField
          {...register("email")}
          label="E-mail"
          type="email"
          fullWidth
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        <TextField
          {...register("password")}
          label="Parolă"
          type="password"
          fullWidth
          error={!!errors.password}
          helperText={errors.password?.message}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {isSubmitting ? "Se conectează..." : "Conectare"}
        </Button>
      </Stack>
    </Box>
  );
};

// ─── RegisterInline ───────────────────────────────────────────────────────────

function RegisterInline({ supabase, emailRedirectTo, onError, onSuccess }: {
  supabase: SupabaseClient<Database>;
  emailRedirectTo: string;
  onError: (msg: string | null) => void;
  onSuccess: (email: string) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WizardRegisterFormData>({ resolver: zodResolver(wizardRegisterSchema) });

  const onSubmit = async (data: WizardRegisterFormData) => {
    onError(null);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { emailRedirectTo },
    });
    if (error) {
      onError(error.message);
    } else {
      onSuccess(data.email);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        <TextField
          {...register("email")}
          label="E-mail"
          type="email"
          fullWidth
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        <TextField
          {...register("password")}
          label="Parolă"
          type="password"
          fullWidth
          error={!!errors.password}
          helperText={errors.password?.message}
        />
        <TextField
          {...register("confirmPassword")}
          label="Confirmă parola"
          type="password"
          fullWidth
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {isSubmitting ? "Se creează contul..." : "Creează cont gratuit"}
        </Button>
      </Stack>
    </Box>
  );
};

// ─── UpgradeAuthGate ──────────────────────────────────────────────────────────
// Shown in the confirmation step when the user is anonymous or unauthenticated.

function UpgradeAuthGate({ supabase, emailRedirectTo, onRegistered }: {
  supabase: SupabaseClient<Database>;
  emailRedirectTo: string;
  onRegistered: (email: string) => void;
}) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [error, setError] = useState<string | null>(null);

  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 2, mt: 3, borderColor: "primary.main" }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
        <LockOpenIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>
          Publică anunțul
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Creează un cont gratuit sau conectează-te pentru a publica anunțul. Anunțul tău este salvat și te așteptăm.
      </Typography>

      <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
        <Button
          variant={mode === "register" ? "contained" : "outlined"}
          onClick={() => { setMode("register"); setError(null); }}
          sx={{ flex: 1 }}
        >
          Cont nou
        </Button>
        <Button
          variant={mode === "login" ? "contained" : "outlined"}
          onClick={() => { setMode("login"); setError(null); }}
          sx={{ flex: 1 }}
        >
          Am deja cont
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {mode === "login" ? (
        <LoginInline supabase={supabase} onError={setError} />
      ) : (
        <RegisterInline
          supabase={supabase}
          emailRedirectTo={emailRedirectTo}
          onError={setError}
          onSuccess={onRegistered}
        />
      )}
    </Paper>
  );
};

// ─── ConfirmationStep (pure preview) ─────────────────────────────────────────

interface ConfirmationProps {
  jobData: JobFormData;
  jobBenefits: BenefitDraft[];
  companyData: CompanyFormData;
  companyLogoUrl: string | null;
  onEditJob: () => void;
  onEditCompany: () => void;
}

function ConfirmationStep({
  jobData,
  jobBenefits,
  companyData,
  companyLogoUrl,
  onEditJob,
  onEditCompany,
}: ConfirmationProps) {
  const descriptionText = jobData.description.replace(/<[^>]*>/g, "").trim();
  const salaryText = formatSalary(
    jobData.salary_min ? Number(jobData.salary_min) : null,
    jobData.salary_max ? Number(jobData.salary_max) : null
  );

  return (
    <Stack spacing={3}>
      {/* Company card */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={companyLogoUrl ?? undefined}
              sx={{ width: 56, height: 56, bgcolor: "primary.main" }}
            >
              <BusinessIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {companyData.name}
              </Typography>
              {companyData.industry && (
                <Typography variant="body2" color="text.secondary">
                  {companyData.industry}
                  {companyData.size ? ` · ${companyData.size} angajați` : ""}
                </Typography>
              )}
              {companyData.location && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <LocationOnOutlinedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                  <Typography variant="caption" color="text.secondary">
                    {companyData.location}
                  </Typography>
                </Stack>
              )}
            </Box>
          </Stack>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={onEditCompany}
            sx={{ color: "text.secondary" }}
            aria-label="Editează compania"
          >
            Editează
          </Button>
        </Stack>
      </Paper>

      {/* Job card */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={800} sx={{ pr: 2 }}>
            {jobData.title}
          </Typography>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={onEditJob}
            sx={{ color: "text.secondary", flexShrink: 0 }}
            aria-label="Editează anunțul"
          >
            Editează
          </Button>
        </Stack>

        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
            <JobTags job={jobData as JobTagsJob} hideLocation={true} />
            {jobData.location && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <LocationOnOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {jobData.location}
                </Typography>
              </Stack>
            )}
            {(jobData.salary_min || jobData.salary_max) && (
                <Typography variant="body2" fontWeight={700}>
                {formatSalary(jobData.salary_min ? Number(jobData.salary_min) : null, jobData.salary_max ? Number(jobData.salary_max) : null)}
              </Typography>
            )}
        </Stack>

        {descriptionText && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              mb: 2,
            }}
          >
            {descriptionText}
          </Typography>
        )}

        {jobBenefits.length > 0 && (
          <>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Typography variant="h3" fontWeight={700}>Beneficii</Typography>
              <Chip
                label={jobBenefits.length}
                size="small"
                color="success"
                variant="outlined"
                sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }}
              />
            </Stack>
            <Stack spacing={1.25}>
              {jobBenefits.map((b, i) => (
                <Stack key={i} direction="row" alignItems="center" spacing={1.5}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 16, color: "success.main", flexShrink: 0 }} />
                  <Typography variant="body1" fontWeight={500}>{b.title}</Typography>
                </Stack>
              ))}
            </Stack>
          </>
        )}

        {jobData.application_method === "url" && jobData.application_url && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" color="text.secondary">
              Candidații vor aplica la:{" "}
              <Typography
                component="a"
                href={jobData.application_url}
                target="_blank"
                rel="noopener noreferrer"
                variant="caption"
                sx={{ color: "primary.main" }}
              >
                {jobData.application_url}
              </Typography>
            </Typography>
          </>
        )}
      </Paper>
    </Stack>
  );
};

// ─── Loading overlay ──────────────────────────────────────────────────────────

function PublishingOverlay({ message }: { message: string }) {
  return (
  <Box
    sx={{
      position: "fixed",
      inset: 0,
      bgcolor: "background.paper",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
    }}
  >
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <CircularProgress size={80} thickness={2.5} sx={{ color: "primary.main" }} />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <RocketLaunchIcon sx={{ fontSize: 32, color: "primary.main" }} />
      </Box>
    </Box>
    <Typography variant="h5" fontWeight={800} textAlign="center">
      Publicăm anunțul...
    </Typography>
    <Typography
      variant="body1"
      color="text.secondary"
      textAlign="center"
      sx={{ minHeight: 28, transition: "opacity 0.3s" }}
    >
      {message}
    </Typography>
  </Box>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function AnuntWizard() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();

  // step: 0=job, 1=company, 2=confirm+publish
  const [step, setStep] = useState(0);

  const [jobData, setJobData] = useState<JobFormData | null>(null);
  const [jobBenefits, setJobBenefits] = useState<BenefitDraft[]>([]);
  const [companyData, setCompanyData] = useState<CompanyFormData | null>(null);
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);

  // email captured when the user registers from the auth gate
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  // true when the draft was restored from localStorage after email confirmation
  const [draftRestored, setDraftRestored] = useState(false);

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  const jobFormRef = useRef<AddEditJobHandle>(null);
  const companyFormRef = useRef<AddEditCompanyHandle>(null);

  // ── Auto sign-in anonymously so we always have a session ─────────────────
  // This lets us track the user through the wizard without requiring account
  // creation, and allows future draft-saving to the DB under a consistent ID.
  useEffect(() => {
    if (!authLoading && !user) {
      void supabase.auth.signInAnonymously();
    }
  }, [authLoading, user, supabase.auth]);

  // ── Restore a saved draft when the user returns after confirming email ────
  useEffect(() => {
    if (!user || user.is_anonymous || !user.email_confirmed_at) return;
    const draft = loadDraft();
    if (!draft) return;
    setJobData(draft.jobData);
    setJobBenefits(draft.jobBenefits ?? []);
    setCompanyData(draft.companyData);
    setCompanyLogoUrl(draft.companyLogoUrl ?? null);
    setDraftRestored(true);
    setStep(2);
    clearDraft();
  }, [user]);

  // ── Rotate loading messages during publish ────────────────────────────────
  useEffect(() => {
    if (!publishing) return;
    const id = setInterval(
      () => setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length),
      1400
    );
    return () => clearInterval(id);
  }, [publishing]);

  // ── Step 0: store job data → step 1 ──────────────────────────────────────
  const handleJobSubmit = useCallback(
    async (data: JobFormData, _status: "draft" | "published", benefits?: BenefitDraft[]) => {
      setJobData(data);
      setJobBenefits(benefits ?? []);
      setStep(1);
    },
    []
  );

  // ── Step 1: store company data → step 2 (always) ─────────────────────────
  const handleCompanySubmit = useCallback(
    async (data: CompanyFormData, logoFile: File | null) => {
      setCompanyData(data);
      setCompanyLogoFile(logoFile);
      setCompanyLogoUrl(logoFile ? URL.createObjectURL(logoFile) : null);
      setStep(2);
    },
    []
  );

  // ── Back navigation ───────────────────────────────────────────────────────
  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 1) setStep(0);
  };

  // ── "Continuă" button for steps 0 and 1 ──────────────────────────────────
  const handleNext = async () => {
    if (step === 0) await jobFormRef.current?.submit();
    else if (step === 1) await companyFormRef.current?.submit();
  };

  // ── Save draft to localStorage when the user registers from the auth gate ─
  const handleRegistered = useCallback(
    (email: string) => {
      setRegisteredEmail(email);
      if (jobData && companyData) {
        saveDraft({ jobData, jobBenefits, companyData, companyLogoUrl });
      }
    },
    [jobData, jobBenefits, companyData, companyLogoUrl]
  );

  // ── Final publish ─────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!user || user.is_anonymous || !jobData || !companyData) return;
    setPublishing(true);
    setPublishError(null);

    try {
      const companySlug = `${slugify(companyData.name)}-${Date.now().toString(36)}`;
      const company = await createCompany(
        supabase,
        {
          name: companyData.name,
          slug: companySlug,
          description: companyData.description || null,
          website: companyData.website || null,
          industry: companyData.industry || null,
          size: companyData.size || null,
          location: companyData.location || null,
          founded_year: companyData.founded_year ? Number(companyData.founded_year) : null,
          created_by: user.id,
        },
        user.id
      );

      if (companyLogoFile) {
        const ext = companyLogoFile.name.split(".").pop() ?? "jpg";
        const path = `${company.id}/logo.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("company-logos")
          .upload(path, companyLogoFile, { upsert: true });
        if (!upErr) {
          const { data: urlData } = supabase.storage
            .from("company-logos")
            .getPublicUrl(path);
          await updateCompany(supabase, company.id, { logo_url: urlData.publicUrl });
        }
      }

      const jobSlug = `${slugify(jobData.title)}-${slugify(companyData.name)}-${Date.now().toString(36)}`;
      const job = await createJob(supabase, {
        company_id: company.id,
        title: jobData.title,
        slug: jobSlug,
        description: jobData.description,
        location: jobData.location || null,
        job_type: jobData.job_type || null,
        experience_level: jobData.experience_level.length > 0 ? jobData.experience_level : null,
        salary_min: jobData.salary_min ? Number(jobData.salary_min) : null,
        salary_max: jobData.salary_max ? Number(jobData.salary_max) : null,
        is_remote: jobData.is_remote,
        application_url: jobData.application_method === "url" ? (jobData.application_url || null) : null,
        status: "published",
        published_at: new Date().toISOString(),
      });

      if (jobBenefits.length > 0) {
        await Promise.all(
          jobBenefits.map((b) =>
            createBenefit(supabase, { job_id: job.id, title: b.title, sort_order: b.sort_order })
          )
        );
      }

      void supabase.functions
        .invoke("send-email", {
          body: { event: "company_created", company_id: company.id },
        })
        .catch((e: unknown) => console.warn("notify-created failed:", e));

      void supabase.functions
        .invoke("alerts-job-match", { body: { job_id: job.id } })
        .catch((e: unknown) => console.warn("alerts-job-match:", e));

      router.push(`/jobs/${job.slug}`);
    } catch (err) {
      setPublishError(parseSupabaseError(err));
      setPublishing(false);
    }
  };

  // ── Auth-gate conditions ──────────────────────────────────────────────────
  // After the user registers from the gate, `user` stays anonymous until they
  // click the confirmation link and return (triggering the draft restore above).
  const isAnonymous = !user || user.is_anonymous === true;
  const isPendingConfirmation =
    registeredEmail !== null && (!user || user.is_anonymous === true);
  const canPublish =
    !!user && user.is_anonymous !== true && !!user.email_confirmed_at;

  // Build the emailRedirectTo so the confirmation link returns to this wizard
  // page, which will then auto-restore the saved draft.
  const emailRedirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(window.location.pathname)}`
      : "/auth/callback";

  if (authLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {publishing && <PublishingOverlay message={LOADING_MESSAGES[loadingMsgIdx]} />}

      <Box
        sx={{
          display: { xs: "block", md: "grid" },
          gridTemplateColumns: { md: "240px 1fr" },
          gap: { md: 5 },
          alignItems: "flex-start",
        }}
      >
        {/* ── Sticky sidebar ────────────────────────────────────────────── */}
        <Box
          sx={{
            position: { md: "sticky" },
            top: { md: "calc(64px + 24px)" },
          }}
        >
          {/* Page title — desktop only */}
          <Box sx={{ display: { xs: "none", md: "block" }, mb: 5 }}>
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{ mb: 0.75, letterSpacing: "-0.3px" }}
            >
              Publică un anunț
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completează pașii de mai jos pentru a publica anunțul tău de angajare.
            </Typography>
          </Box>

          {/* Mobile: compact step badge */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              gap: 1.5,
              mb: 2.5,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Typography variant="caption" fontWeight={700} color="white">
                {step + 1}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2 }}>
                Pasul {step + 1} din {STEP_LABELS.length}
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {STEP_LABELS[step]}
              </Typography>
            </Box>
          </Box>

          {/* Desktop: vertical step navigation */}
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            {STEP_LABELS.map((label, i) => {
              const isCompleted = i < step;
              const isActive = i === step;
              const isLast = i === STEP_LABELS.length - 1;
              return (
                <Box key={label}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                    {/* Step circle */}
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: isCompleted
                          ? "success.main"
                          : isActive
                            ? "primary.main"
                            : "transparent",
                        border: "2px solid",
                        borderColor: isCompleted
                          ? "success.main"
                          : isActive
                            ? "primary.main"
                            : "divider",
                        color:
                          isCompleted || isActive ? "white" : "text.disabled",
                      }}
                    >
                      {isCompleted ? (
                        <CheckIcon sx={{ fontSize: 16 }} />
                      ) : (
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          lineHeight={1}
                        >
                          {i + 1}
                        </Typography>
                      )}
                    </Box>

                    {/* Step label */}
                    <Box sx={{ pt: 0.25 }}>
                      <Typography
                        variant="body2"
                        fontWeight={isActive ? 700 : 500}
                        color={
                          isActive
                            ? "text.primary"
                            : isCompleted
                              ? "text.secondary"
                              : "text.disabled"
                        }
                      >
                        {label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {STEP_DESCRIPTIONS[i]}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Vertical connector */}
                  {!isLast && (
                    <Box
                      sx={{
                        ml: "15px",
                        width: 2,
                        height: 28,
                        bgcolor: isCompleted ? "success.main" : "divider",
                        my: 0.5,
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <Box>
          <Paper
            variant="outlined"
            sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, minHeight: 400 }}
          >
            {/* ── Step 0: Job details ── */}
            {step === 0 && (
              <>
                <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
                  Detalii anunț de angajare
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Descrie postul pe care îl oferi. Cu cât ești mai specific, cu atât atragi candidații mai potriviți.
                </Typography>
                <AddEditJob
                  ref={jobFormRef}
                  key="wizard-job"
                  companies={[{ id: PLACEHOLDER_COMPANY_ID, name: "Compania ta" }]}
                  editingJob={null}
                  defaultValues={
                    jobData ?? {
                      company_id: PLACEHOLDER_COMPANY_ID,
                      title: "",
                      description: "",
                      location: "",
                      job_type: "",
                      experience_level: [],
                      salary_min: "",
                      salary_max: "",
                      is_remote: false,
                      application_method: "url",
                      application_url: "",
                      form_id: "",
                    }
                  }
                  onSubmit={handleJobSubmit}
                  onCancel={() => {}}
                  hideActions
                  wizardMode
                />
              </>
            )}

            {/* ── Step 1: Company details ── */}
            {step === 1 && (
              <>
                <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
                  Compania ta
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Candidații vor vedea aceste informații alături de anunțul tău.
                </Typography>
                <AddEditCompany
                  ref={companyFormRef}
                  key="wizard-company"
                  editing={null}
                  defaultValues={
                    companyData ?? {
                      name: "",
                      description: "",
                      website: "",
                      industry: "",
                      size: "",
                      location: "",
                      founded_year: "",
                    }
                  }
                  initialLogoUrl={companyLogoUrl}
                  onSubmit={handleCompanySubmit}
                  onCancel={() => {}}
                  hideActions
                />
              </>
            )}

            {/* ── Step 2: Confirmation + publish gate ── */}
            {step === 2 && jobData && companyData && (
              <>
                <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
                  Verifică și publică
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Acesta este cum va arăta anunțul tău. Poți edita orice detaliu înainte de publicare.
                </Typography>

                {draftRestored && (
                  <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                    <AlertTitle fontWeight={700}>Ciornă restaurată</AlertTitle>
                    Anunțul tău a fost salvat. Acum că ți-ai confirmat adresa de e-mail, poți publica.
                  </Alert>
                )}

                <ConfirmationStep
                  jobData={jobData}
                  jobBenefits={jobBenefits}
                  companyData={companyData}
                  companyLogoUrl={companyLogoUrl}
                  onEditJob={() => setStep(0)}
                  onEditCompany={() => setStep(1)}
                />

                <Box sx={{ mt: 3 }}>
                  {isAnonymous && !isPendingConfirmation && (
                    <UpgradeAuthGate
                      supabase={supabase}
                      emailRedirectTo={emailRedirectTo}
                      onRegistered={handleRegistered}
                    />
                  )}

                  {isPendingConfirmation && (
                    <Alert
                      severity="info"
                      icon={<MarkEmailReadIcon fontSize="inherit" />}
                      sx={{ borderRadius: 2 }}
                    >
                      <AlertTitle fontWeight={700}>Confirmă adresa de e-mail</AlertTitle>
                      Am trimis un link de confirmare la{" "}
                      <strong>{registeredEmail}</strong>. După ce apeși pe link, vei fi
                      redirecționat înapoi aici și anunțul tău va fi publicat automat.
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        Verifică și dosarul Spam dacă nu primești e-mailul.
                      </Typography>
                    </Alert>
                  )}

                  {canPublish && (
                    <Stack spacing={2}>
                      {publishError && (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>
                          {publishError}
                        </Alert>
                      )}
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={publishing}
                        startIcon={
                          publishing
                            ? <CircularProgress size={20} color="inherit" />
                            : <RocketLaunchIcon />
                        }
                        onClick={handlePublish}
                        sx={{ py: 1.75, fontSize: "1rem", fontWeight: 700 }}
                      >
                        {publishing ? "Se publică..." : "Publică anunțul"}
                      </Button>
                    </Stack>
                  )}
                </Box>
              </>
            )}
          </Paper>

          {/* Navigation buttons
              — fixed to the bottom of the viewport on mobile,
                normal flow on desktop (md+)                           */}
          <Box
            sx={{
              // Mobile: fixed bar
  
              px: { xs: 2, md: 0 },
              py: { xs: 1.5, md: 0 },
              mt: { xs: 0, md: 3 },
            }}
          >
            {step < 2 ? (
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={handleBack}
                  disabled={step === 0}
                  sx={{ visibility: step === 0 ? "hidden" : "visible" }}
                >
                  Înapoi
                </Button>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleNext}
                  sx={{ px: 4 }}
                >
                  Continuă
                </Button>
              </Stack>
            ) : (
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
              >
                Înapoi
              </Button>
            )}
          </Box>

          {/* Spacer so the fixed nav bar never overlaps the last form field on mobile */}
          <Box sx={{ display: { xs: "block", md: "none" }, height: 72 }} />
        </Box>
      </Box>
    </>
  );
};
