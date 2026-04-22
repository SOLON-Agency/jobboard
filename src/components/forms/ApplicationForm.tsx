"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { getFormWithFields } from "@/services/forms.service";
import { trackCompanyEngage } from "@/services/companies.service";
import { parseSupabaseError, truncate } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import type { Tables } from "@/types/database";
import { JobTags } from "../jobs/JobTags";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormField = Tables<"form_fields">;
type FormWithFields = Tables<"forms"> & { form_fields: FormField[] };

export interface ApplicationFormProps {
  job: Pick<
    Tables<"job_listings">,
    "id" | "title" | "description" | "application_form_id" | "company_id" | "location" | "job_type" | "experience_level" | "is_remote"
  >;
  company?: Pick<Tables<"companies">, "name" | "logo_url" | "slug"> | null;
  open: boolean;
  onClose: () => void;
  /** Called after a successful submission (or duplicate detection) so the
   *  parent can mark the job as already applied. */
  onSubmitted: () => void;
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

function FormFieldInput({
  field,
  value,
  fileValue,
  error,
  onChange,
  onFileChange,
}: FieldProps) {
  const options = Array.isArray(field.options)
    ? (field.options as string[])
    : typeof field.options === "string"
      ? (field.options as string)
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
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
            {field.label}
            {field.is_required ? " *" : ""}
          </FormLabel>
          <RadioGroup value={value} onChange={(e) => onChange(e.target.value)}>
            {options.map((opt) => (
              <FormControlLabel
                key={opt}
                value={opt}
                control={<Radio size="small" />}
                label={opt}
              />
            ))}
          </RadioGroup>
          {error && <FormHelperText>{error}</FormHelperText>}
        </FormControl>
      );

    case "checkbox":
      return (
        <FormControl required={field.is_required} error={!!error} fullWidth>
          <FormLabel sx={{ fontSize: "0.875rem" }}>
            {field.label}
            {field.is_required ? " *" : ""}
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
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 0.5 }}
          >
            {field.label}
            {field.is_required ? " *" : ""}
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

const isApplicationsDuplicateError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const { code, message = "" } = err as { code?: string; message?: string };
  if (code !== "23505") return false;
  const m = message.toLowerCase();
  if (m.includes("form_response")) return false;
  return m.includes("application") || /job_id|user_id/.test(m);
};

// ─── ApplicationForm ──────────────────────────────────────────────────────────

export function ApplicationForm({
  job,
  company,
  open,
  onClose,
  onSubmitted,
}: ApplicationFormProps) {
  const { user } = useAuth();
  const supabase = useSupabase();

  const [formSpec, setFormSpec] = useState<FormWithFields | null>(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fileValues, setFileValues] = useState<Record<string, File | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  // Fetch form spec once when the drawer first opens
  useEffect(() => {
    if (!open || !job.application_form_id || formSpec) return;
    setLoadingForm(true);
    getFormWithFields(supabase, job.application_form_id)
      .then((form) => {
        setFormSpec(form);
        const init: Record<string, string> = {};
        form.form_fields.forEach((f) => {
          init[f.id] = "";
        });
        setFieldValues(init);
      })
      .finally(() => setLoadingForm(false));
  }, [open, job.application_form_id, formSpec, supabase]);

  // Reset transient UI state each time the drawer closes
  useEffect(() => {
    if (!open) {
      setSubmitted(false);
      setSubmitError(null);
      setErrors({});
      setDescriptionExpanded(false);
    }
  }, [open]);

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
    if (!user) {
      setSubmitError("Trebuie să fii autentificat pentru a aplica.");
      return;
    }
    if (!user.email?.trim()) {
      setSubmitError(
        "Contul tău nu are adresă de email verificată. Adaugă un email în setările contului pentru a aplica.",
      );
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const finalValues: Record<string, string> = { ...fieldValues };
      for (const [fieldId, file] of Object.entries(fileValues)) {
        if (!file) continue;
        const path = `${job.id}/${fieldId}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("attachments")
          .upload(path, file);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("attachments").getPublicUrl(path);
        finalValues[fieldId] = data.publicUrl;
      }

      const response = await fetch("/api/jobs/apply-internal-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ job_id: job.id, field_values: finalValues }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        code?: string;
      };

      if (!response.ok) {
        if (response.status === 409 || payload.code === "23505") {
          onSubmitted();
          return;
        }
        setSubmitError(
          payload.error ??
            "A apărut o eroare la trimiterea candidaturii. Te rugăm să încerci din nou.",
        );
        return;
      }

      trackCompanyEngage(supabase, job.company_id).catch(() => {});
      setSubmitted(true);
      onSubmitted();
    } catch (err) {
      if (isApplicationsDuplicateError(err)) {
        onSubmitted();
        return;
      }
      setSubmitError(parseSupabaseError(err));
    } finally {
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, supabase, job, formSpec, fieldValues, fileValues, onSubmitted]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={() => !submitting && onClose()}
      PaperProps={{
        sx: { width: { xs: "100%", sm: 480 }, display: "flex", flexDirection: "column" },
      }}
    >
      {/* Header */}
      <Box sx={{ flexShrink: 0, borderBottom: "1px solid", borderColor: "divider" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 3, pt: 2, pb: 1.5 }}
        >
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ letterSpacing: 1, lineHeight: 1 }}
          >
            Aplică acum
          </Typography>
          <IconButton
            onClick={() => !submitting && onClose()}
            size="small"
            disabled={submitting}
            aria-label="Închide formularul"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Job + company summary */}
        <JobTags job={job} sx={{ px: 3, pb: 2.5 }} />

        <Stack direction="row" spacing={2} alignItems="center" sx={{ px: 3, pb: 2.5 }}>
          <Avatar
            src={company?.logo_url ?? undefined}
            variant="rounded"
            sx={{
              width: 52,
              height: 52,
              bgcolor: "background.default",
              borderRadius: 0,
              flexShrink: 0,
            }}
          >
            <WorkOutlineIcon sx={{ color: "text.secondary", fontSize: 24 }} />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            
            <Stack direction="row" spacing={0.4} alignItems="center" sx={{ mt: 0.5 }}>
              <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ lineHeight: 1.3, mr: 1 }}>
                {job.title}
              </Typography>
            </Stack>
            {company?.name && (
              <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.25 }}>
                {company.name}
              </Typography>
            )}
          </Box>
        </Stack>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflow: "auto", px: 3, py: 3 }}>
        {submitted ? (
          <Stack alignItems="center" spacing={2} sx={{ py: 6, textAlign: "center" }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 56, color: "success.main" }} />
            <Typography variant="h5" fontWeight={700}>
              Aplicație trimisă!
            </Typography>
            <Typography color="text.secondary">
              Candidatura ta a fost înregistrată. Vei fi contactat dacă ești selectat.
            </Typography>
            <Button variant="outlined" onClick={onClose} sx={{ mt: 1 }}>
              Închide
            </Button>
          </Stack>
        ) : loadingForm ? (
          <Stack spacing={2}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={56} />
            ))}
          </Stack>
        ) : !user ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Trebuie să fii{" "}
            <Link href="/login" style={{ color: "inherit", fontWeight: 700 }}>
              autentificat
            </Link>{" "}
            pentru a aplica la acest loc de muncă.
          </Alert>
        ) : (
          <Stack spacing={2.5}>
            {job.description && (() => {
              const isHtml = job.description.trimStart().startsWith("<");
              const plainText = isHtml
                ? job.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
                : job.description;
              const isLong = plainText.length > 500;

              return (
                <Box>
                  {descriptionExpanded ? (
                    isHtml ? (
                      <Box
                        dangerouslySetInnerHTML={{ __html: job.description }}
                        sx={{
                          fontSize: "0.875rem",
                          "& p": { mb: 1, lineHeight: 1.7, color: "text.secondary" },
                          "& ul, & ol": { pl: 2.5, mb: 1, color: "text.secondary" },
                          "& li": { mb: 0.25 },
                          "& strong": { color: "text.primary", fontWeight: 700 },
                          "& a": { color: "primary.main" },
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          fontSize: "0.875rem",
                          color: "text.secondary",
                          "& p": { mb: 1, lineHeight: 1.7 },
                          "& ul, & ol": { pl: 2.5, mb: 1 },
                          "& li": { mb: 0.25 },
                          "& strong": { color: "text.primary", fontWeight: 700 },
                          "& a": { color: "primary.main" },
                        }}
                      >
                        <ReactMarkdown>{job.description}</ReactMarkdown>
                      </Box>
                    )
                  ) : (
                    <Typography variant="body2" color="text.secondary"
                      sx={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
                      {truncate(plainText, 500)}
                    </Typography>
                  )}
                  {isLong && (
                    <Button
                      size="small"
                      onClick={() => setDescriptionExpanded((prev) => !prev)}
                      sx={{ mt: 0.5, p: 0, minWidth: 0, textTransform: "none", fontWeight: 600 }}
                      endIcon={descriptionExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />} 
                    >
                      {descriptionExpanded ? "Citește mai puțin" : "Citește toată descrierea"}
                    </Button>
                  )}
                </Box>
              );
            })()}
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
        <Stack
          direction="row"
          spacing={2}
          sx={{
            px: 3,
            py: 2.5,
            flexShrink: 0,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button
            variant="contained"
            fullWidth
            disabled={submitting}
            onClick={handleSubmit}
            endIcon={
              submitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <AutoAwesomeIcon />
              )
            }
            sx={{ borderRadius: 5, fontWeight: 700 }}
          >
            {submitting ? "Se trimite..." : "Trimite candidatura"}
          </Button>
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={submitting}
            sx={{ borderRadius: 5 }}
          >
            Anulează
          </Button>
        </Stack>
      )}
    </Drawer>
  );
};
