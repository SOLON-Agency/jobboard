"use client";

import React, { useMemo, useState } from "react";
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
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
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
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type FieldType,
  type FormField,
  type FormBuilderData,
  FIELD_TYPE_LABELS,
  FIELD_WITH_OPTIONS,
  FIELD_WITH_PLACEHOLDER,
  emptyField,
  createFormBuilderSchema,
  type FormBuilderFormData,
} from "@/components/forms/validations/form-builder.schema";
import type { Tables } from "@/types/database";

export type { FieldType, FormField, FormBuilderData };

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

interface AddEditFormProps {
  companies: { id: string; name: string }[];
  editingForm: (Tables<"forms"> & { form_fields: Tables<"form_fields">[] }) | null;
  defaultValues: FormBuilderData;
  defaultFields: FormField[];
  onSubmit: (
    data: FormBuilderData,
    fields: FormField[],
    status: "draft" | "published"
  ) => Promise<void>;
  onDelete?: () => void;
  onCancel: () => void;
}

export function AddEditForm({
  companies,
  editingForm,
  defaultValues,
  defaultFields,
  onSubmit,
  onDelete,
  onCancel,
}: AddEditFormProps) {
  const requireCompany = companies.length > 1;
  const schema = useMemo(() => createFormBuilderSchema(requireCompany), [requireCompany]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormBuilderFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...defaultValues,
      fields: defaultFields,
    },
  });

  const { fields, append, remove, move, update } = useFieldArray({
    control,
    name: "fields",
  });

  const [pendingStatus, setPendingStatus] = useState<"draft" | "published" | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | false>(false);

  const addField = () => {
    append(emptyField(fields.length));
    setExpandedIndex(fields.length);
  };

  const removeField = (index: number) => {
    remove(index);
    setExpandedIndex((prev) => {
      if (prev === false || prev < index) return prev;
      if (prev === index) return false;
      return (prev as number) - 1;
    });
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= fields.length) return;
    move(index, target);
    fields.forEach((_, i) => update(i, { ...fields[i], sort_order: i }));
  };

  const handleSave = async (status: "draft" | "published", data: FormBuilderFormData) => {
    setPendingStatus(status);
    try {
      const { fields: formFields, ...meta } = data;
      await onSubmit(meta, formFields.map((f, i) => ({ ...f, sort_order: i })), status);
    } finally {
      setPendingStatus(null);
    }
  };

  const isDisabled = isSubmitting || pendingStatus !== null;

  return (
    <Box
      component="form"
      noValidate
      onSubmit={(e) => e.preventDefault()}
    >
      <Stack spacing={3}>
        <Stack spacing={2}>
          {requireCompany && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                Societate *
              </Typography>
              <Controller
                name="company_id"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    size="small"
                    fullWidth
                    error={!!errors.company_id}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      Selectează societatea...
                    </MenuItem>
                    {companies.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.company_id && (
                <Typography variant="caption" color="error" role="alert">
                  {errors.company_id.message}
                </Typography>
              )}
            </Box>
          )}

          <TextField
            label="Numele formularului *"
            size="small"
            fullWidth
            {...register("name")}
            error={!!errors.name}
            helperText={errors.name?.message}
            inputProps={{ "aria-describedby": errors.name ? "form-name-error" : undefined }}
          />
          {errors.name && (
            <Typography id="form-name-error" variant="caption" color="error" role="alert" sx={{ display: "none" }}>
              {errors.name.message}
            </Typography>
          )}

          <TextField
            label="Descriere (opțional)"
            size="small"
            fullWidth
            multiline
            rows={2}
            {...register("description")}
          />
        </Stack>

        <Stack spacing={0.5}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Câmpuri formular ({fields.length})
            </Typography>
            <Button
              type="button"
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
                Niciun câmp adăugat. Apasă „Adaugă câmp” pentru a începe.
              </Typography>
            </Paper>
          )}

          <Box sx={{ mt: 1 }}>
            {fields.map((field, index) => {
              const fieldErrors = errors.fields?.[index];
              return (
                <Accordion
                  key={field.id}
                  expanded={expandedIndex === index}
                  onChange={(_, open) => setExpandedIndex(open ? index : false)}
                  disableGutters
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor:
                      fieldErrors?.label || fieldErrors?.options_raw
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
                    <Box sx={{ color: "primary.main", display: "flex", alignItems: "center", flexShrink: 0 }}>
                      {FIELD_TYPE_ICONS[field.field_type as FieldType]}
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight={500}
                      noWrap
                      sx={{ flex: 1, color: field.label ? "text.primary" : "text.disabled" }}
                    >
                      {field.label || `Câmp ${index + 1} — ${FIELD_TYPE_LABELS[field.field_type as FieldType]}`}
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
                      <Controller
                        name={`fields.${index}.field_type`}
                        control={control}
                        render={({ field: typeField }) => (
                          <Select
                            {...typeField}
                            size="small"
                            fullWidth
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
                        )}
                      />

                      <TextField
                        label="Etichetă *"
                        size="small"
                        fullWidth
                        {...register(`fields.${index}.label`)}
                        error={!!fieldErrors?.label}
                        helperText={fieldErrors?.label?.message}
                      />

                      {FIELD_WITH_PLACEHOLDER.includes(field.field_type as FieldType) && (
                        <TextField
                          label="Placeholder (opțional)"
                          size="small"
                          fullWidth
                          {...register(`fields.${index}.placeholder`)}
                        />
                      )}

                      {FIELD_WITH_OPTIONS.includes(field.field_type as FieldType) && (
                        <TextField
                          label="Opțiuni (separate prin virgulă) *"
                          size="small"
                          fullWidth
                          {...register(`fields.${index}.options_raw`)}
                          placeholder="ex: Opțiunea 1, Opțiunea 2, Opțiunea 3"
                          error={!!fieldErrors?.options_raw}
                          helperText={
                            fieldErrors?.options_raw?.message ??
                            "Introdu opțiunile separate prin virgulă"
                          }
                        />
                      )}

                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Controller
                          name={`fields.${index}.is_required`}
                          control={control}
                          render={({ field: reqField }) => (
                            <FormControlLabel
                              control={
                                <Switch
                                  size="small"
                                  checked={reqField.value}
                                  onChange={(e) => reqField.onChange(e.target.checked)}
                                />
                              }
                              label={<Typography variant="caption">Câmp obligatoriu</Typography>}
                            />
                          )}
                        />

                        <Stack direction="row" spacing={0}>
                          <Tooltip title="Mută sus">
                            <span>
                              <IconButton
                                type="button"
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
                                type="button"
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
                              type="button"
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
              );
            })}
          </Box>
        </Stack>

        <Divider />

        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button
            type="button"
            variant="outlined"
            color="secondary"
            disabled={isDisabled}
            sx={{ px: 4 }}
            onClick={handleSubmit((data) => handleSave("draft", data))}
          >
            {pendingStatus === "draft"
              ? "Se salvează..."
              : editingForm
                ? "Actualizează formularul"
                : "Salvează ciornă"}
          </Button>

          {!editingForm && (
            <Button
              type="button"
              variant="contained"
              color="primary"
              disabled={isDisabled}
              sx={{ px: 4 }}
              onClick={handleSubmit((data) => handleSave("published", data))}
            >
              {pendingStatus === "published" ? "Se publică..." : "Publică formularul"}
            </Button>
          )}

          {onDelete && (
            <Button type="button" variant="outlined" color="error" disabled={isDisabled} onClick={onDelete}>
              Șterge
            </Button>
          )}
          <Button type="button" variant="outlined" onClick={onCancel} disabled={isDisabled}>
            Anulează
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
