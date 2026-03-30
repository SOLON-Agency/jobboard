"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import {
  Alert,
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
  type SxProps,
  type Theme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { getFormWithFields } from "@/services/forms.service";
import { parseSupabaseError } from "@/lib/utils";
import type { Tables } from "@/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormField = Tables<"form_fields">;
type FormWithFields = Tables<"forms"> & { form_fields: FormField[] };

export interface ApplyButtonProps {
  job: Pick<
    Tables<"job_listings">,
    "id" | "slug" | "title" | "application_url" | "application_form_id"
  >;
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

// ─── Main component ───────────────────────────────────────────────────────────

export const ApplyButton: React.FC<ApplyButtonProps> = ({
  job,
  label = "Aplică",
  size = "medium",
  fullWidth = false,
  variant = "contained",
  sx,
}) => {
  const { user } = useAuth();
  const supabase = useSupabase();

  const [open, setOpen] = useState(false);
  const [formSpec, setFormSpec] = useState<FormWithFields | null>(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fileValues, setFileValues] = useState<Record<string, File | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  // ── External URL → simple anchor ──────────────────────────────────────────
  if (job.application_url && !job.application_form_id) {
    return (
      <Button
        component="a"
        href={job.application_url}
        target="_blank"
        rel="noopener noreferrer"
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

  // ── Form application ──────────────────────────────────────────────────────
  const openDrawer = async () => {
    setOpen(true);
    setSubmitted(false);
    setSubmitError(null);
    setErrors({});
    if (formSpec) return; // already loaded
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
      if (!f.is_required) return;
      if (f.field_type === "upload") {
        if (!fileValues[f.id]) errs[f.id] = "Câmp obligatoriu";
      } else if (!fieldValues[f.id]?.trim()) {
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
        onClick={openDrawer}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        endIcon={<AutoAwesomeIcon />}
        sx={commonSx}
      >
        {label}
      </Button>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => !submitting && setOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 480 }, display: "flex", flexDirection: "column" } }}
      >
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2, flexShrink: 0, borderBottom: "1px solid", borderColor: "divider" }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Aplică la</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>{job.title}</Typography>
          </Box>
          <IconButton onClick={() => !submitting && setOpen(false)} size="small" disabled={submitting}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {/* Body */}
        <Box sx={{ flex: 1, overflow: "auto", px: 3, py: 3 }}>
          {/* Success state */}
          {submitted ? (
            <Stack alignItems="center" spacing={2} sx={{ py: 6, textAlign: "center" }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 56, color: "success.main" }} />
              <Typography variant="h5" fontWeight={700}>Aplicație trimisă!</Typography>
              <Typography color="text.secondary">
                Candidatura ta a fost înregistrată. Vei fi contactat dacă ești selectat.
              </Typography>
              <Button variant="outlined" onClick={() => setOpen(false)} sx={{ mt: 1 }}>
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
                <Typography variant="body2" color="text.secondary">{formSpec.description}</Typography>
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
            <Button variant="outlined" onClick={() => setOpen(false)} disabled={submitting} sx={{ borderRadius: 5 }}>
              Anulează
            </Button>
          </Stack>
        )}
      </Drawer>
    </>
  );
};
