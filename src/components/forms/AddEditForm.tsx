"use client";

import React, { useState, useCallback } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
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
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ShortTextIcon from "@mui/icons-material/ShortText";
import PinIcon from "@mui/icons-material/Pin";
import SubjectIcon from "@mui/icons-material/Subject";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import {
  type FieldType,
  type FormField,
  type FormBuilderData,
  FIELD_TYPE_LABELS,
  FIELD_WITH_OPTIONS,
  FIELD_WITH_PLACEHOLDER,
  emptyField,
} from "@/components/forms/validations/form-builder.schema";
import type { Tables } from "@/types/database";

export type { FieldType, FormField, FormBuilderData };

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELD_TYPE_ICONS: Record<FieldType, React.ReactElement> = {
  text: <ShortTextIcon fontSize="small" />,
  email: <EmailOutlinedIcon fontSize="small" />,
  phone: <PhoneOutlinedIcon fontSize="small" />,
  number: <PinIcon fontSize="small" />,
  textarea: <SubjectIcon fontSize="small" />,
  radio: <RadioButtonCheckedIcon fontSize="small" />,
  checkbox: <CheckBoxOutlinedIcon fontSize="small" />,
  upload: <CloudUploadOutlinedIcon fontSize="small" />,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddEditFormProps {
  companies: { id: string; name: string }[];
  editingForm: (Tables<"forms"> & { form_fields: Tables<"form_fields">[] }) | null;
  defaultValues: FormBuilderData;
  defaultFields: FormField[];
  onSubmit: (
    data: FormBuilderData,
    fields: FormField[],
    status: "draft" | "published",
  ) => Promise<void>;
  onDelete?: () => void;
  onCancel: () => void;
}

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
  const [formData, setFormData] = useState<FormBuilderData>(defaultValues);
  const [fields, setFields] = useState<FormField[]>(defaultFields);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingStatus, setPendingStatus] = useState<"draft" | "published" | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | false>(false);

  // ─── Form data helpers ──────────────────────────────────────────────────────

  const setField = useCallback(
    <K extends keyof FormBuilderData>(key: K, value: FormBuilderData[K]) =>
      setFormData((prev) => ({ ...prev, [key]: value })),
    [],
  );

  // ─── Field helpers ──────────────────────────────────────────────────────────

  const addField = () => {
    setFields((prev) => {
      setExpandedIndex(prev.length);
      return [...prev, emptyField(prev.length)];
    });
  };

  const removeField = (index: number) => {
    setFields((prev) =>
      prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, sort_order: i })),
    );
    setExpandedIndex((prev) => {
      if (prev === false || prev < index) return prev;
      if (prev === index) return false;
      return (prev as number) - 1;
    });
  };

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
              <MenuItem value="" disabled>
                Selectează compania...
              </MenuItem>
              {companies.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
            {errors.company_id && (
              <Typography variant="caption" color="error">
                {errors.company_id}
              </Typography>
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

      {/* ── Fields ────────────────────────────────────────────────────────── */}
      <Stack spacing={0.5}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
            Câmpuri formular ({fields.length})
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={addField}
            variant="outlined"
            sx={{ borderRadius: 5, mb: 2 }}
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

        <Box sx={{ mt: 1 }}>
          {fields.map((field, index) => (
            <Accordion
              key={index}
              expanded={expandedIndex === index}
              onChange={(_, open) => setExpandedIndex(open ? index : false)}
              disableGutters
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor:
                  errors[`field_${index}_label`] || errors[`field_${index}_options`]
                    ? "error.main"
                    : "divider",
                borderRadius: "8px !important",
                mb: 1,
                "&:before": { display: "none" },
                "&.Mui-expanded": { borderColor: "primary.main" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  px: 2,
                  minHeight: 52,
                  "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1.5, my: 0 },
                }}
              >
                <Box
                  sx={{ color: "primary.main", display: "flex", alignItems: "center", flexShrink: 0 }}
                >
                  {FIELD_TYPE_ICONS[field.field_type]}
                </Box>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  noWrap
                  sx={{ flex: 1, color: field.label ? "text.primary" : "text.disabled" }}
                >
                  {field.label || `Câmp ${index + 1} — ${FIELD_TYPE_LABELS[field.field_type]}`}
                </Typography>
                {field.is_required && (
                  <Chip
                    label="Obligatoriu"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ height: 20, fontSize: "0.65rem", flexShrink: 0 }}
                  />
                )}
              </AccordionSummary>

              <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1.5}>
                  {/* Type selector */}
                  <Select
                    size="small"
                    fullWidth
                    value={field.field_type}
                    onChange={(e) =>
                      updateField(index, "field_type", e.target.value as FieldType)
                    }
                    renderValue={(v) => (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ color: "primary.main", display: "flex" }}>
                          {FIELD_TYPE_ICONS[v as FieldType]}
                        </Box>
                        <span>{FIELD_TYPE_LABELS[v as FieldType]}</span>
                      </Stack>
                    )}
                  >
                    {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((t) => (
                      <MenuItem key={t} value={t}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Box sx={{ color: "primary.main", display: "flex" }}>
                            {FIELD_TYPE_ICONS[t]}
                          </Box>
                          <Typography variant="body2">{FIELD_TYPE_LABELS[t]}</Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>

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
                      helperText={
                        errors[`field_${index}_options`] ??
                        "Introdu opțiunile separate prin virgulă"
                      }
                    />
                  )}

                  <Stack direction="row" alignItems="center" justifyContent="space-between">
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

                    <Stack direction="row" spacing={0}>
                      <Tooltip title="Mută sus">
                        <span>
                          <IconButton
                            size="small"
                            disabled={index === 0}
                            onClick={() => moveField(index, "up")}
                            aria-label="Mută câmp sus"
                          >
                            <ArrowUpwardIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Mută jos">
                        <span>
                          <IconButton
                            size="small"
                            disabled={index === fields.length - 1}
                            onClick={() => moveField(index, "down")}
                            aria-label="Mută câmp jos"
                          >
                            <ArrowDownwardIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Șterge câmp">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeField(index)}
                          aria-label="Șterge câmp"
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
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
