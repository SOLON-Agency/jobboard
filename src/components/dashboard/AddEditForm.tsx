"use client";

import React, { useState, useCallback } from "react";
import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import type { Tables } from "@/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FieldType = "text" | "number" | "textarea" | "radio" | "checkbox" | "upload";

export interface FormField {
  id?: string;
  field_type: FieldType;
  label: string;
  placeholder: string;
  is_required: boolean;
  /** Comma-separated options string for radio / checkbox */
  options_raw: string;
  sort_order: number;
}

export interface FormData {
  name: string;
  description: string;
  company_id: string;
}

interface AddEditFormProps {
  companies: { id: string; name: string }[];
  editingForm: (Tables<"forms"> & { form_fields: Tables<"form_fields">[] }) | null;
  defaultValues: FormData;
  defaultFields: FormField[];
  onSubmit: (data: FormData, fields: FormField[], status: "draft" | "published") => Promise<void>;
  onDelete?: () => void;
  onCancel: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Câmp text",
  number: "Număr",
  textarea: "Text lung",
  radio: "Selecție unică (radio)",
  checkbox: "Selecție multiplă",
  upload: "Încărcare fișier",
};

const FIELD_WITH_OPTIONS: FieldType[] = ["radio", "checkbox"];
const FIELD_WITH_PLACEHOLDER: FieldType[] = ["text", "number", "textarea"];

const emptyField = (order: number): FormField => ({
  field_type: "text",
  label: "",
  placeholder: "",
  is_required: false,
  options_raw: "",
  sort_order: order,
});

// ─── Component ────────────────────────────────────────────────────────────────

export const AddEditForm: React.FC<AddEditFormProps> = ({
  companies,
  editingForm,
  defaultValues,
  defaultFields,
  onSubmit,
  onDelete,
  onCancel,
}) => {
  const [formData, setFormData] = useState<FormData>(defaultValues);
  const [fields, setFields] = useState<FormField[]>(defaultFields);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingStatus, setPendingStatus] = useState<"draft" | "published" | null>(null);

  // ─── Form data helpers ──────────────────────────────────────────────────────

  const setField = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) =>
      setFormData((prev) => ({ ...prev, [key]: value })),
    []
  );

  // ─── Field helpers ──────────────────────────────────────────────────────────

  const addField = () =>
    setFields((prev) => [...prev, emptyField(prev.length)]);

  const removeField = (index: number) =>
    setFields((prev) => prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, sort_order: i })));

  const moveField = (index: number, direction: "up" | "down") => {
    const next = [...fields];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setFields(next.map((f, i) => ({ ...f, sort_order: i })));
  };

  const updateField = <K extends keyof FormField>(index: number, key: K, value: FormField[K]) =>
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, [key]: value } : f)));

  // ─── Validation ─────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Numele formularului este obligatoriu";
    if (companies.length > 1 && !formData.company_id) errs.company_id = "Selectează o companie";
    fields.forEach((f, i) => {
      if (!f.label.trim()) errs[`field_${i}_label`] = "Eticheta este obligatorie";
      if (FIELD_WITH_OPTIONS.includes(f.field_type) && !f.options_raw.trim()) {
        errs[`field_${i}_options`] = "Adaugă cel puțin o opțiune";
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleSave = async (status: "draft" | "published") => {
    if (!validate()) return;
    setPendingStatus(status);
    try {
      await onSubmit(formData, fields, status);
    } finally {
      setPendingStatus(null);
    }
  };

  const isDisabled = pendingStatus !== null;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Stack spacing={3}>
      {/* ── Form meta ─────────────────────────────────────────────────────── */}
      <Stack spacing={2}>
        {companies.length > 1 && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Companie *
            </Typography>
            <Select
              size="small"
              fullWidth
              value={formData.company_id}
              onChange={(e) => setField("company_id", e.target.value)}
              error={!!errors.company_id}
              displayEmpty
            >
              <MenuItem value="" disabled>Selectează compania...</MenuItem>
              {companies.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
            {errors.company_id && (
              <Typography variant="caption" color="error">{errors.company_id}</Typography>
            )}
          </Box>
        )}

        <TextField
          label="Numele formularului *"
          size="small"
          fullWidth
          value={formData.name}
          onChange={(e) => setField("name", e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
        />
        <TextField
          label="Descriere (opțional)"
          size="small"
          fullWidth
          multiline
          rows={2}
          value={formData.description}
          onChange={(e) => setField("description", e.target.value)}
        />
      </Stack>

      <Divider />

      {/* ── Fields ────────────────────────────────────────────────────────── */}
      <Stack spacing={0.5}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2" fontWeight={700}>
            Câmpuri ({fields.length})
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={addField}
            variant="outlined"
            sx={{ borderRadius: 5 }}
          >
            Adaugă câmp
          </Button>
        </Stack>

        {fields.length === 0 && (
          <Paper
            variant="outlined"
            sx={{ p: 3, textAlign: "center", borderStyle: "dashed", borderRadius: 2 }}
          >
            <Typography variant="body2" color="text.secondary">
              Niciun câmp adăugat. Apasă „Adaugă câmp" pentru a începe.
            </Typography>
          </Paper>
        )}

        <Stack spacing={1.5} sx={{ mt: 1 }}>
          {fields.map((field, index) => (
            <Paper
              key={index}
              variant="outlined"
              sx={{ p: 2, borderRadius: 2, position: "relative" }}
            >
              {/* ── Field header ─────────────────────────────── */}
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <DragIndicatorIcon sx={{ color: "text.disabled", fontSize: 18, cursor: "grab" }} />
                <Select
                  size="small"
                  value={field.field_type}
                  onChange={(e) => updateField(index, "field_type", e.target.value as FieldType)}
                  sx={{ flex: 1, fontSize: "0.85rem" }}
                >
                  {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((t) => (
                    <MenuItem key={t} value={t} sx={{ fontSize: "0.85rem" }}>
                      {FIELD_TYPE_LABELS[t]}
                    </MenuItem>
                  ))}
                </Select>
                <Stack direction="row" spacing={0}>
                  <Tooltip title="Mută sus">
                    <span>
                      <IconButton size="small" disabled={index === 0} onClick={() => moveField(index, "up")}>
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Mută jos">
                    <span>
                      <IconButton size="small" disabled={index === fields.length - 1} onClick={() => moveField(index, "down")}>
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Șterge câmp">
                    <IconButton size="small" color="error" onClick={() => removeField(index)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>

              {/* ── Field config ──────────────────────────────── */}
              <Stack spacing={1.5}>
                <TextField
                  label="Etichetă *"
                  size="small"
                  fullWidth
                  value={field.label}
                  onChange={(e) => updateField(index, "label", e.target.value)}
                  error={!!errors[`field_${index}_label`]}
                  helperText={errors[`field_${index}_label`]}
                />

                {FIELD_WITH_PLACEHOLDER.includes(field.field_type) && (
                  <TextField
                    label="Placeholder (opțional)"
                    size="small"
                    fullWidth
                    value={field.placeholder}
                    onChange={(e) => updateField(index, "placeholder", e.target.value)}
                  />
                )}

                {FIELD_WITH_OPTIONS.includes(field.field_type) && (
                  <TextField
                    label="Opțiuni (separate prin virgulă) *"
                    size="small"
                    fullWidth
                    value={field.options_raw}
                    onChange={(e) => updateField(index, "options_raw", e.target.value)}
                    placeholder="ex: Opțiunea 1, Opțiunea 2, Opțiunea 3"
                    error={!!errors[`field_${index}_options`]}
                    helperText={errors[`field_${index}_options`] ?? "Introdu opțiunile separate prin virgulă"}
                  />
                )}

                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={field.is_required}
                      onChange={(e) => updateField(index, "is_required", e.target.checked)}
                    />
                  }
                  label={<Typography variant="caption">Câmp obligatoriu</Typography>}
                />
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Stack>

      <Divider />

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Button
          variant="outlined"
          color="secondary"
          disabled={isDisabled}
          sx={{ px: 4 }}
          onClick={() => handleSave("draft")}
        >
          {pendingStatus === "draft"
            ? "Se salvează..."
            : editingForm
            ? "Actualizează formularul"
            : "Salvează ciornă"}
        </Button>

        {!editingForm && (
          <Button
            variant="contained"
            color="primary"
            disabled={isDisabled}
            sx={{ px: 4 }}
            onClick={() => handleSave("published")}
          >
            {pendingStatus === "published" ? "Se publică..." : "Publică formularul"}
          </Button>
        )}

        {onDelete && (
          <Button variant="outlined" color="error" disabled={isDisabled} onClick={onDelete}>
            Șterge
          </Button>
        )}
        <Button variant="outlined" onClick={onCancel} disabled={isDisabled}>
          Anulează
        </Button>
      </Stack>
    </Stack>
  );
};
