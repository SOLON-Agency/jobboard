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
  Avatar,
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
  TextField,
  Typography,
} from "@mui/material";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";

import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { createClient } from "@/lib/supabase/client";
import {
  AddEditJob,
  type AddEditJobHandle,
  type JobFormData,
  type BenefitDraft,
} from "@/components/dashboard/AddEditJob";
import {
  AddEditCompany,
  type AddEditCompanyHandle,
  type CompanyFormData,
} from "@/components/dashboard/AddEditCompany";
import { createJob } from "@/services/jobs.service";
import { createCompany, updateCompany } from "@/services/companies.service";
import { createBenefit } from "@/services/benefits.service";
import { slugify, parseSupabaseError, jobTypeLabels, experienceLevelLabels, formatSalary } from "@/lib/utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// ─── Loading messages ─────────────────────────────────────────────────────────

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

// ─── Auth step schemas ────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Email invalid"),
  password: z.string().min(6, "Minim 6 caractere"),
});
type LoginData = z.infer<typeof loginSchema>;

const registerSchema = z
  .object({
    email: z.string().email("Email invalid"),
    password: z.string().min(6, "Minim 6 caractere"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Parolele nu corespund",
    path: ["confirmPassword"],
  });
type RegisterData = z.infer<typeof registerSchema>;

// ─── Wizard step config ───────────────────────────────────────────────────────

const STEP_LABELS = ["Anunț", "Companie", "Cont", "Confirmare"];

// ─── Inline auth forms ────────────────────────────────────────────────────────

const LoginInline: React.FC<{ onError: (msg: string | null) => void }> = ({ onError }) => {
  const supabase = createClient();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginData) => {
    onError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) onError(error.message);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
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

const RegisterInline: React.FC<{
  onError: (msg: string | null) => void;
  onSuccess: (email: string) => void;
}> = ({ onError, onSuccess }) => {
  const supabase = createClient();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterData) => {
    onError(null);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      onError(error.message);
    } else {
      onSuccess(data.email);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
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
          {isSubmitting ? "Se creează contul..." : "Creează cont"}
        </Button>
      </Stack>
    </Box>
  );
};

// ─── Confirmation preview ────────────────────────────────────────────────────

interface ConfirmationProps {
  jobData: JobFormData;
  jobBenefits: BenefitDraft[];
  companyData: CompanyFormData;
  companyLogoUrl: string | null;
  onEditJob: () => void;
  onEditCompany: () => void;
  onPublish: () => void;
  publishing: boolean;
  error: string | null;
}

const ConfirmationStep: React.FC<ConfirmationProps> = ({
  jobData,
  jobBenefits,
  companyData,
  companyLogoUrl,
  onEditJob,
  onEditCompany,
  onPublish,
  publishing,
  error,
}) => {
  const descriptionText = jobData.description.replace(/<[^>]*>/g, "").trim();
  const salaryText = formatSalary(
    jobData.salary_min ? Number(jobData.salary_min) : null,
    jobData.salary_max ? Number(jobData.salary_max) : null
  );

  return (
    <Stack spacing={3}>
      {/* Company card */}
      <Paper
        variant="outlined"
        sx={{ p: 3, borderRadius: 2 }}
      >
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
          >
            Editează
          </Button>
        </Stack>

        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
          {jobData.job_type && (
            <Chip label={jobTypeLabels[jobData.job_type] ?? jobData.job_type} size="small" variant="outlined" />
          )}
          {jobData.is_remote && (
            <Chip label="Remote" size="small" color="success" variant="outlined" />
          )}
          {jobData.location && (
            <Chip
              icon={<LocationOnOutlinedIcon />}
              label={jobData.location}
              size="small"
              variant="outlined"
            />
          )}
          {jobData.experience_level.length > 0 && (
            <Chip
              label={jobData.experience_level
                .map((l) => experienceLevelLabels[l] ?? l)
                .join(" – ")}
              size="small"
              variant="outlined"
            />
          )}
          {(jobData.salary_min || jobData.salary_max) && (
            <Chip label={salaryText} size="small" variant="outlined" />
          )}
        </Stack>

        {descriptionText && (
          <>
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
          </>
        )}

        {jobBenefits.length > 0 && (
          <>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              {/* <CardGiftcardIcon sx={{ fontSize: 22, color: "#2d6a4f" }} /> */}
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
                  <Typography variant="body1" fontWeight={500}>
                    {b.title}
                  </Typography>
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

      {error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        size="large"
        fullWidth
        disabled={publishing}
        startIcon={publishing ? <CircularProgress size={20} color="inherit" /> : <RocketLaunchIcon />}
        onClick={onPublish}
        sx={{ py: 1.75, fontSize: "1rem", fontWeight: 700 }}
      >
        {publishing ? "Se publică..." : "Publică anunțul"}
      </Button>
    </Stack>
  );
};

// ─── Loading overlay ──────────────────────────────────────────────────────────

const PublishingOverlay: React.FC<{ message: string }> = ({ message }) => (
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
      <CircularProgress
        size={80}
        thickness={2.5}
        sx={{ color: "primary.main" }}
      />
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

// ─── Main wizard ──────────────────────────────────────────────────────────────

const PLACEHOLDER_COMPANY_ID = "wizard-pending";

export const AnuntWizard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();

  // ── Wizard step (0=job, 1=company, 2=auth, 3=confirm) ──────────────────
  const [step, setStep] = useState(0);

  // ── Step data ──────────────────────────────────────────────────────────
  const [jobData, setJobData] = useState<JobFormData | null>(null);
  const [jobBenefits, setJobBenefits] = useState<BenefitDraft[]>([]);
  const [companyData, setCompanyData] = useState<CompanyFormData | null>(null);
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);

  // ── Auth step state ───────────────────────────────────────────────────
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [authError, setAuthError] = useState<string | null>(null);
  // email captured at registration time — used to show the confirmation banner
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  // ── Publish state ─────────────────────────────────────────────────────
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  // ── Step refs for imperative form triggers ────────────────────────────
  const jobFormRef = useRef<AddEditJobHandle>(null);
  const companyFormRef = useRef<AddEditCompanyHandle>(null);

  // ── Rotate loading messages ───────────────────────────────────────────
  useEffect(() => {
    if (!publishing) return;
    const id = setInterval(
      () => setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length),
      1400
    );
    return () => clearInterval(id);
  }, [publishing]);

  // ── Auto-advance from auth step once user authenticates ───────────────
  useEffect(() => {
    if (user && step === 2) setStep(3);
  }, [user, step]);

  // ── Advance helpers ───────────────────────────────────────────────────
  const advanceFromCompany = useCallback(() => {
    if (user) {
      setStep(3); // skip auth
    } else {
      setStep(2);
    }
  }, [user]);

  // ── Step 0 submit: store job data → step 1 ────────────────────────────
  const handleJobSubmit = useCallback(
    async (data: JobFormData, _status: "draft" | "published", benefits?: BenefitDraft[]) => {
      setJobData(data);
      setJobBenefits(benefits ?? []);
      setStep(1);
    },
    []
  );

  // ── Step 1 submit: store company data → step 2/3 ──────────────────────
  const handleCompanySubmit = useCallback(
    async (data: CompanyFormData, logoFile: File | null) => {
      setCompanyData(data);
      setCompanyLogoFile(logoFile);
      setCompanyLogoUrl(logoFile ? URL.createObjectURL(logoFile) : null);
      advanceFromCompany();
    },
    [advanceFromCompany]
  );

  // ── Back navigation ───────────────────────────────────────────────────
  const handleBack = () => {
    if (step === 3 && !user) setStep(2);
    else if (step === 3 && user) setStep(1);
    else if (step === 2) setStep(1);
    else if (step > 0) setStep((s) => s - 1);
  };

  // ── Trigger next from external "Continuă" button ──────────────────────
  const handleNext = async () => {
    if (step === 0) {
      await jobFormRef.current?.submit();
    } else if (step === 1) {
      await companyFormRef.current?.submit();
    }
  };

  // ── Final publish ─────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!user || !jobData || !companyData) return;
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

      const jobSlug = `${slugify(jobData.title)}-${Date.now().toString(36)}`;
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

      void fetch("/api/companies/notify-created", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ company_id: company.id }),
      });

      router.push(`/jobs/${job.slug}`);
    } catch (err) {
      setPublishError(parseSupabaseError(err));
      setPublishing(false);
    }
  };

  // ── Effective display step index (auth step shown as step 2 only when not authed) ──
  const displayStep = user && step >= 2 ? step - 1 : step;
  const displayLabels = user
    ? STEP_LABELS.filter((_, i) => i !== 2)
    : STEP_LABELS;

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

      {/* Stepper header */}
      <Paper
        variant="outlined"
        sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: 3 }}
      >
        <Stepper activeStep={displayStep} alternativeLabel>
          {displayLabels.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step content */}
      <Paper
        variant="outlined"
        sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, minHeight: 400 }}
      >
        {/* ── Step 0: Job details ── */}
        {step === 0 && (
          <>
            <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
              Detalii anunț
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
            <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
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

        {/* ── Step 2: Auth (only when not authenticated) ── */}
        {step === 2 && !user && (
          <>
            <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
              Contul tău
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Autentifică-te sau creează un cont gratuit pentru a publica anunțul.
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
              <Button
                variant={authMode === "register" ? "contained" : "outlined"}
                onClick={() => { setAuthMode("register"); setAuthError(null); }}
                sx={{ flex: 1 }}
              >
                Cont nou
              </Button>
              <Button
                variant={authMode === "login" ? "contained" : "outlined"}
                onClick={() => { setAuthMode("login"); setAuthError(null); }}
                sx={{ flex: 1 }}
              >
                Am deja cont
              </Button>
            </Stack>

            {authError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {authError}
              </Alert>
            )}

            {authMode === "login" ? (
              <LoginInline onError={setAuthError} />
            ) : (
              <RegisterInline
                onError={setAuthError}
                onSuccess={(email) => {
                  setRegisteredEmail(email);
                  setStep(3);
                }}
              />
            )}
          </>
        )}

        {/* ── Step 3: Confirmation ── */}
        {step === 3 && jobData && companyData && (
          <>
            <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
              Verifică și publică
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Acesta este cum va arăta anunțul tău. Poți edita orice detaliu înainte de publicare.
            </Typography>
            {registeredEmail && !user && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Contul tău a fost creat pentru <strong>{registeredEmail}</strong>.
                Confirmă adresa de e-mail, apoi revino pentru a publica anunțul.
              </Alert>
            )}
            <ConfirmationStep
              jobData={jobData}
              jobBenefits={jobBenefits}
              companyData={companyData}
              companyLogoUrl={companyLogoUrl}
              onEditJob={() => setStep(0)}
              onEditCompany={() => setStep(1)}
              onPublish={handlePublish}
              publishing={publishing}
              error={publishError}
            />
          </>
        )}
      </Paper>

      {/* Navigation footer */}
      {step !== 3 && (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: 3 }}
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

          {/* Auth step: navigation is handled by the forms themselves */}
          {step !== 2 && (
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={handleNext}
              sx={{ px: 4 }}
            >
              Continuă
            </Button>
          )}
        </Stack>
      )}
    </>
  );
};
