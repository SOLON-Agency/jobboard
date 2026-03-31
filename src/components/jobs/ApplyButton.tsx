"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  IconButton,
  Radio,
  RadioGroup,
  Skeleton,
  Stack,
  TextField,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { getFormWithFields } from "@/services/forms.service";
import { trackCompanyEngage } from "@/services/companies.service";
import { parseSupabaseError } from "@/lib/utils";
import type { Tables } from "@/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormField = Tables<"form_fields">;
type FormWithFields = Tables<"forms"> & { form_fields: FormField[] };

export interface ApplyButtonProps {
  job: Pick<
    Tables<"job_listings">,
    "id" | "slug" | "title" | "application_url" | "application_form_id" | "company_id"
    | "location" | "job_type" | "salary_min" | "salary_max"
  >;
  company?: Pick<Tables<"companies">, "name" | "logo_url" | "slug"> | null;
  label?: string;
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  variant?: "contained" | "outlined";
  sx?: SxProps<Theme>;
}

// ─── Field renderer ───────────────────────────────────────────────────────────

interface FieldProps {
  field: FormField;
  value: string;
  fileValue: File | null;
  error?: string;
  onChange: (val: string) => void;
  onFileChange: (file: File | null) => void;
}

const FormFieldInput: React.FC<FieldProps> = ({ field, value, fileValue, error, onChange, onFileChange }) => {
  const options = Array.isArray(field.options)
    ? (field.options as string[])
    : typeof field.options === "string"
    ? (field.options as string).split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];

  const selectedCheckboxes = value ? value.split("|||") : [];

  switch (field.field_type) {
    case "textarea":
      return (
        <TextField
          label={field.label}
          placeholder={field.placeholder ?? undefined}
          required={field.is_required}
          multiline
          minRows={3}
          fullWidth
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={!!error}
          helperText={error}
          size="small"
        />
      );

    case "number":
      return (
        <TextField
          label={field.label}
          placeholder={field.placeholder ?? undefined}
          required={field.is_required}
          type="number"
          fullWidth
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={!!error}
          helperText={error}
          size="small"
        />
      );

    case "radio":
      return (
        <FormControl required={field.is_required} error={!!error} fullWidth>
          <FormLabel sx={{ fontSize: "0.875rem" }}>
            {field.label}{field.is_required ? " *" : ""}
          </FormLabel>
          <RadioGroup value={value} onChange={(e) => onChange(e.target.value)}>
            {options.map((opt) => (
              <FormControlLabel key={opt} value={opt} control={<Radio size="small" />} label={opt} />
            ))}
          </RadioGroup>
          {error && <FormHelperText>{error}</FormHelperText>}
        </FormControl>
      );

    case "checkbox":
      return (
        <FormControl required={field.is_required} error={!!error} fullWidth>
          <FormLabel sx={{ fontSize: "0.875rem" }}>
            {field.label}{field.is_required ? " *" : ""}
          </FormLabel>
          <FormGroup>
            {options.map((opt) => (
              <FormControlLabel
                key={opt}
                control={
                  <Checkbox
                    size="small"
                    checked={selectedCheckboxes.includes(opt)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...selectedCheckboxes, opt]
                        : selectedCheckboxes.filter((v) => v !== opt);
                      onChange(next.join("|||"));
                    }}
                  />
                }
                label={opt}
              />
            ))}
          </FormGroup>
          {error && <FormHelperText>{error}</FormHelperText>}
        </FormControl>
      );

    case "upload":
      return (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
            {field.label}{field.is_required ? " *" : ""}
          </Typography>
          <Button
            component="label"
            variant="outlined"
            size="small"
            startIcon={<AttachFileIcon />}
            sx={{ borderStyle: "dashed" }}
            color={error ? "error" : "inherit"}
          >
            {fileValue ? fileValue.name : "Alege fișier"}
            <input
              hidden
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
          </Button>
          {error && <FormHelperText error>{error}</FormHelperText>}
        </Box>
      );

    case "email":
      return (
        <TextField
          label={field.label}
          placeholder={field.placeholder ?? "exemplu@email.com"}
          required={field.is_required}
          type="email"
          inputMode="email"
          fullWidth
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={!!error}
          helperText={error}
          size="small"
        />
      );

    case "phone":
      return (
        <TextField
          label={field.label}
          placeholder={field.placeholder ?? "ex: 0721 000 000 sau +40 721 000 000"}
          required={field.is_required}
          type="tel"
          inputMode="tel"
          fullWidth
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={!!error}
          helperText={error}
          size="small"
        />
      );

    default: // "text"
      return (
        <TextField
          label={field.label}
          placeholder={field.placeholder ?? undefined}
          required={field.is_required}
          fullWidth
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={!!error}
          helperText={error}
          size="small"
        />
      );
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const notifyApplication = (
  supabase: ReturnType<typeof useSupabase>,
  job_id: string,
  applicant_user_id: string
) => {
  // Fire-and-forget: notification failure must not block the application flow.
  supabase.functions
    .invoke("notify-application", { body: { job_id, applicant_user_id } })
    .catch((err: unknown) => console.warn("notify-application:", err));
};

// ─── Main component ───────────────────────────────────────────────────────────

export const ApplyButton: React.FC<ApplyButtonProps> = ({
  job,
  company,
  label = "Aplică",
  size = "medium",
  fullWidth = false,
  variant = "contained",
  sx,
}) => {
  const { user } = useAuth();
  const supabase = useSupabase();

  // ── Form drawer state ──
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formSpec, setFormSpec] = useState<FormWithFields | null>(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fileValues, setFileValues] = useState<Record<string, File | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── External URL confirmation dialog state ──
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const commonSx = { borderRadius: 5, fontWeight: 700, ...sx };

  // ── No application method → link to job page ──────────────────────────────
  if (!job.application_url && !job.application_form_id) {
    return (
      <Button
        component={Link}
        href={`/jobs/${job.slug}`}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        endIcon={<AutoAwesomeIcon />}
        sx={commonSx}
      >
        {label}
      </Button>
    );
  }

  const isExternalUrl = !!job.application_url && !job.application_form_id;

  // ── External URL: open confirmation dialog ────────────────────────────────
  const handleConfirmOpen = () => {
    setConfirmError(null);
    setConfirmed(false);
    setConfirmOpen(true);
  };

  const handleConfirmApply = async () => {
    if (!user) {
      setConfirmError("Trebuie să fii autentificat pentru a aplica.");
      return;
    }
    setConfirming(true);
    setConfirmError(null);
    try {
      const { error: appErr } = await supabase.from("applications").insert({
        job_id: job.id,
        user_id: user.id,
        form_data: null,
        status: "pending",
      });
      if (appErr) throw appErr;

      notifyApplication(supabase, job.id, user.id);
      trackCompanyEngage(supabase, job.company_id).catch(() => {});
      setConfirmed(true);
      window.open(job.application_url!, "_blank", "noopener,noreferrer");
    } catch (err) {
      setConfirmError(parseSupabaseError(err));
    } finally {
      setConfirming(false);
    }
  };

  // ── Form: open drawer ─────────────────────────────────────────────────────
  const openDrawer = async () => {
    setDrawerOpen(true);
    setSubmitted(false);
    setSubmitError(null);
    setErrors({});
    if (formSpec) return;
    setLoadingForm(true);
    try {
      const form = await getFormWithFields(supabase, job.application_form_id!);
      setFormSpec(form);
      const init: Record<string, string> = {};
      form.form_fields.forEach((f) => { init[f.id] = ""; });
      setFieldValues(init);
    } finally {
      setLoadingForm(false);
    }
  };

  const setField = (id: string, val: string) =>
    setFieldValues((prev) => ({ ...prev, [id]: val }));

  const setFile = (id: string, file: File | null) =>
    setFileValues((prev) => ({ ...prev, [id]: file }));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    formSpec?.form_fields.forEach((f) => {
      const val = fieldValues[f.id]?.trim() ?? "";
      if (f.field_type === "upload") {
        if (f.is_required && !fileValues[f.id]) errs[f.id] = "Câmp obligatoriu";
      } else if (f.field_type === "email") {
        if (f.is_required && !val) {
          errs[f.id] = "Câmp obligatoriu";
        } else if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          errs[f.id] = "Adresă de email invalidă";
        }
      } else if (f.field_type === "phone") {
        if (f.is_required && !val) {
          errs[f.id] = "Câmp obligatoriu";
        } else if (val && !/^(\+?\d[\d\s\-().]{6,19}\d)$/.test(val)) {
          errs[f.id] = "Număr de telefon invalid (ex: 0721 000 000 sau +40 721 000 000)";
        }
      } else if (f.is_required && !val) {
        errs[f.id] = "Câmp obligatoriu";
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    if (!user) { setSubmitError("Trebuie să fii autentificat pentru a aplica."); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Upload files and collect final string values
      const finalValues: Record<string, string> = { ...fieldValues };
      for (const [fieldId, file] of Object.entries(fileValues)) {
        if (!file) continue;
        const path = `${job.id}/${fieldId}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("attachments").upload(path, file);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("attachments").getPublicUrl(path);
        finalValues[fieldId] = data.publicUrl;
      }

      // 1. form_responses row
      const { data: responseRow, error: respErr } = await supabase
        .from("form_responses")
        .insert({
          form_id: job.application_form_id!,
          job_listing_id: job.id,
          respondent_email: user.email ?? null,
          respondent_name: user.user_metadata?.full_name ?? user.email ?? null,
        })
        .select("id")
        .single();
      if (respErr) throw respErr;

      // 2. form_response_values rows
      if (formSpec!.form_fields.length > 0) {
        const { error: valErr } = await supabase.from("form_response_values").insert(
          formSpec!.form_fields.map((f) => ({
            response_id: responseRow.id,
            field_id: f.id,
            value: finalValues[f.id] ?? null,
          }))
        );
        if (valErr) throw valErr;
      }

      // 3. applications row — human-readable form_data for dashboard display
      const formDataJson = Object.fromEntries(
        formSpec!.form_fields.map((f) => [f.label, finalValues[f.id] ?? ""])
      );
      const { error: appErr } = await supabase.from("applications").insert({
        job_id: job.id,
        user_id: user.id,
        form_data: formDataJson,
        status: "pending",
      });
      if (appErr) throw appErr;

      // 4. Fire-and-forget email notifications + engagement tracking
      notifyApplication(supabase, job.id, user.id);
      trackCompanyEngage(supabase, job.company_id).catch(() => {});

      setSubmitted(true);
    } catch (err) {
      setSubmitError(parseSupabaseError(err));
    } finally {
      setSubmitting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, supabase, job, formSpec, fieldValues, fileValues]);

  return (
    <>
      <Button
        onClick={isExternalUrl ? handleConfirmOpen : openDrawer}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        endIcon={<AutoAwesomeIcon />}
        sx={commonSx}
      >
        {label}
      </Button>

      {/* ── External URL confirmation dialog ──────────────────────────────── */}
      <Dialog
        open={confirmOpen}
        onClose={() => !confirming && setConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {confirmed ? "Aplicație înregistrată!" : `Aplică la ${job.title}`}
        </DialogTitle>

        <DialogContent>
          {confirmed ? (
            <Stack alignItems="center" spacing={2} sx={{ py: 2, textAlign: "center" }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 52, color: "success.main" }} />
              <Typography color="text.secondary">
                Candidatura a fost înregistrată. Link-ul s-a deschis într-o fereastră nouă.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={2}>
              {!user && (
                <Alert severity="info">
                  Trebuie să fii{" "}
                  <Link href="/login" style={{ color: "inherit", fontWeight: 700 }}>
                    autentificat
                  </Link>{" "}
                  pentru a aplica.
                </Alert>
              )}
              <Typography variant="body2" color="text.secondary">
                Vei fi redirecționat către site-ul extern al angajatorului pentru a finaliza aplicația:
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2,
                  py: 1.5,
                  bgcolor: "action.hover",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  wordBreak: "break-all",
                }}
              >
                <OpenInNewIcon sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                  {job.application_url}
                </Typography>
              </Box>
              {confirmError && <Alert severity="error">{confirmError}</Alert>}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          {confirmed ? (
            <Button
              variant="outlined"
              onClick={() => setConfirmOpen(false)}
              sx={{ borderRadius: 5 }}
            >
              Închide
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                onClick={() => setConfirmOpen(false)}
                disabled={confirming}
                sx={{ borderRadius: 5 }}
              >
                Anulează
              </Button>
              <Button
                variant="contained"
                onClick={handleConfirmApply}
                disabled={confirming || !user}
                endIcon={confirming ? <CircularProgress size={14} color="inherit" /> : <OpenInNewIcon />}
                sx={{ borderRadius: 5, fontWeight: 700 }}
              >
                {confirming ? "Se înregistrează..." : "Continuă"}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* ── Form application drawer ───────────────────────────────────────── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => !submitting && setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 480 }, display: "flex", flexDirection: "column" } }}
      >
        {/* Header */}
        <Box sx={{ flexShrink: 0, borderBottom: "1px solid", borderColor: "divider" }}>
          {/* Close row */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, pt: 2, pb: 1.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1, lineHeight: 1 }}>
              Aplică acum
            </Typography>
            <IconButton onClick={() => !submitting && setDrawerOpen(false)} size="small" disabled={submitting}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          {/* Job + company card */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ px: 3, pb: 2.5 }}>
            <Avatar
              src={company?.logo_url ?? undefined}
              variant="rounded"
              sx={{ width: 52, height: 52, bgcolor: "action.hover", border: "1px solid", borderColor: "divider", flexShrink: 0 }}
            >
              <WorkOutlineIcon sx={{ color: "text.secondary", fontSize: 24 }} />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ lineHeight: 1.3 }}>
                {job.title}
              </Typography>
              {company?.name && (
                <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.25 }}>
                  {company.name}
                </Typography>
              )}
              {job.location && (
                <Stack direction="row" spacing={0.4} alignItems="center" sx={{ mt: 0.5 }}>
                  <LocationOnOutlinedIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                  <Typography variant="caption" color="text.disabled" noWrap>
                    {job.location}
                  </Typography>
                </Stack>
              )}
            </Box>
          </Stack>
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflow: "auto", px: 3, py: 3 }}>
          {submitted ? (
            <Stack alignItems="center" spacing={2} sx={{ py: 6, textAlign: "center" }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 56, color: "success.main" }} />
              <Typography variant="h5" fontWeight={700}>Aplicație trimisă!</Typography>
              <Typography color="text.secondary">
                Candidatura ta a fost înregistrată. Vei fi contactat dacă ești selectat.
              </Typography>
              <Button variant="outlined" onClick={() => setDrawerOpen(false)} sx={{ mt: 1 }}>
                Închide
              </Button>
            </Stack>
          ) : loadingForm ? (
            <Stack spacing={2}>
              {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={56} />)}
            </Stack>
          ) : !user ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Trebuie să fii <Link href="/login" style={{ color: "inherit", fontWeight: 700 }}>autentificat</Link> pentru a aplica la acest loc de muncă.
            </Alert>
          ) : (
            <Stack spacing={2.5}>
              {formSpec?.description && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {formSpec.description.length > 500 && !descriptionExpanded
                      ? `${formSpec.description.slice(0, 500)}...`
                      : formSpec.description}
                  </Typography>
                  {formSpec.description.length > 500 && (
                    <Button
                      size="small"
                      onClick={() => setDescriptionExpanded((prev) => !prev)}
                      sx={{ mt: 0.5, p: 0, minWidth: 0, textTransform: "none", fontWeight: 600 }}
                    >
                      {descriptionExpanded ? "Citește mai puțin" : "Citește mai mult"}
                    </Button>
                  )}
                </Box>
              )}
              {formSpec?.form_fields.map((field) => (
                <FormFieldInput
                  key={field.id}
                  field={field}
                  value={fieldValues[field.id] ?? ""}
                  fileValue={fileValues[field.id] ?? null}
                  error={errors[field.id]}
                  onChange={(val) => setField(field.id, val)}
                  onFileChange={(file) => setFile(field.id, file)}
                />
              ))}
              {submitError && <Alert severity="error">{submitError}</Alert>}
            </Stack>
          )}
        </Box>

        {/* Footer */}
        {!submitted && !loadingForm && user && (
          <Stack direction="row" spacing={2} sx={{ px: 3, py: 2.5, flexShrink: 0, borderTop: "1px solid", borderColor: "divider" }}>
            <Button
              variant="contained"
              fullWidth
              disabled={submitting}
              onClick={handleSubmit}
              endIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
              sx={{ borderRadius: 5, fontWeight: 700 }}
            >
              {submitting ? "Se trimite..." : "Trimite candidatura"}
            </Button>
            <Button variant="outlined" onClick={() => setDrawerOpen(false)} disabled={submitting} sx={{ borderRadius: 5 }}>
              Anulează
            </Button>
          </Stack>
        )}
      </Drawer>
    </>
  );
};
