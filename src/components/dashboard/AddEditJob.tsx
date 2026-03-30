"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Typography,
  TextField,
  Button,
  Stack,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  RadioGroup,
  Radio,
  FormLabel,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSupabase } from "@/hooks/useSupabase";
import { jobTypeLabels, experienceLevelLabels } from "@/lib/utils";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import type { Tables } from "@/types/database";

export const schema = z.object({
  company_id: z.string().min(1, "Selectează o companie"),
  title: z.string().min(3, "Titlul este obligatoriu"),
  description: z
    .string()
    .refine(
      (v) => v.replace(/<[^>]*>/g, "").trim().length >= 10,
      "Descrierea trebuie să aibă cel puțin 10 caractere"
    ),
  location: z.string().optional().or(z.literal("")),
  job_type: z.string().optional().or(z.literal("")),
  experience_level: z.string().optional().or(z.literal("")),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  is_remote: z.boolean(),
  application_method: z.enum(["none", "url", "form"]),
  application_url: z.string().url("Introdu un URL valid").optional().or(z.literal("")),
  form_id: z.string().optional().or(z.literal("")),
});

export type JobFormData = z.infer<typeof schema>;

export type CompanyOption = { id: string; name: string };

export type JobWithCompany = Tables<"job_listings"> & {
  companies: Tables<"companies"> | null;
};

interface AddEditJobProps {
  companies: CompanyOption[];
  editingJob: JobWithCompany | null;
  defaultValues: JobFormData;
  onSubmit: (data: JobFormData, status: "draft" | "published") => Promise<void>;
  onDelete?: () => void;
  onCancel: () => void;
}

export const AddEditJob: React.FC<AddEditJobProps> = ({
  companies,
  editingJob,
  defaultValues,
  onSubmit,
  onDelete,
  onCancel,
}) => {
  const supabase = useSupabase();
  const [formsList, setFormsList] = useState<{ id: string; name: string }[]>([]);
  const [pendingStatus, setPendingStatus] = useState<"draft" | "published" | null>(null);

  const {
    handleSubmit,
    control,
    register,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<JobFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const loadForms = useCallback(
    async (companyId: string) => {
      const { data } = await supabase
        .from("forms")
        .select("id, name")
        .eq("company_id", companyId);
      setFormsList(data ?? []);
    },
    [supabase]
  );

  const selectedCompanyId = watch("company_id");
  useEffect(() => {
    if (selectedCompanyId) loadForms(selectedCompanyId);
  }, [selectedCompanyId, loadForms]);

  return (
    <Box component="form" onSubmit={(e) => e.preventDefault()}>
      <Stack spacing={2.5}>
        {!editingJob && companies.length > 1 && (
          <Controller
            name="company_id"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth required error={!!errors.company_id}>
                <InputLabel>Companie</InputLabel>
                <Select {...field} label="Companie">
                  {companies.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.company_id && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                    {errors.company_id.message}
                  </Typography>
                )}
              </FormControl>
            )}
          />
        )}

        <TextField
          {...register("title")}
          label="Titlul postului"
          fullWidth
          required
          error={!!errors.title}
          helperText={errors.title?.message}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              value={field.value}
              onChange={field.onChange}
              placeholder="Descrie rolul, responsabilitățile, cerințele..."
              error={!!errors.description}
              helperText={errors.description?.message}
              minHeight={240}
            />
          )}
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField {...register("location")} label="Locație" fullWidth />
          <Controller
            name="job_type"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Tip de contract</InputLabel>
                <Select {...field} label="Tip de contract" value={field.value ?? ""}>
                  <MenuItem value="">Nespecificat</MenuItem>
                  {Object.entries(jobTypeLabels).map(([val, label]) => (
                    <MenuItem key={val} value={val}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Controller
            name="experience_level"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Nivel de experiență</InputLabel>
                <Select {...field} label="Nivel de experiență" value={field.value ?? ""}>
                  <MenuItem value="">Nespecificat</MenuItem>
                  {Object.entries(experienceLevelLabels).map(([val, label]) => (
                    <MenuItem key={val} value={val}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
          <Controller
            name="is_remote"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch checked={field.value} onChange={field.onChange} color="primary" />
                }
                label="Poziție la distanță"
                sx={{ mt: 1 }}
              />
            )}
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            {...register("salary_min")}
            label="Salariu minim"
            type="number"
            fullWidth
          />
          <TextField
            {...register("salary_max")}
            label="Salariu maxim"
            type="number"
            fullWidth
          />
        </Stack>

        <Controller
          name="application_method"
          control={control}
          render={({ field }) => (
            <FormControl component="fieldset">
              <FormLabel
                component="legend"
                sx={{ mb: 1, fontSize: "0.875rem", fontWeight: 600 }}
              >
                Unde se va aplica?
              </FormLabel>
              <RadioGroup row {...field}>
                <FormControlLabel
                  value="none"
                  control={<Radio size="small" />}
                  label="Formular intern"
                />
                <FormControlLabel
                  value="url"
                  control={<Radio size="small" />}
                  label="URL extern"
                />
                <FormControlLabel
                  value="form"
                  control={<Radio size="small" />}
                  label="Formular personalizat"
                />
              </RadioGroup>
            </FormControl>
          )}
        />

        {watch("application_method") === "url" && (
          <TextField
            {...register("application_url")}
            label="URL extern pentru aplicare"
            fullWidth
            placeholder="https://..."
            error={!!errors.application_url}
            helperText={errors.application_url?.message}
          />
        )}

        {watch("application_method") === "form" &&
          (formsList.length > 0 ? (
            <Controller
              name="form_id"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Formular de aplicare</InputLabel>
                  <Select {...field} label="Formular de aplicare" value={field.value ?? ""}>
                    <MenuItem value="">Selectează...</MenuItem>
                    {formsList.map((form) => (
                      <MenuItem key={form.id} value={form.id}>
                        {form.name || `Formular ${form.id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              Niciun formular creat pentru această companie. Poți crea formulare din
              secțiunea de setări.
            </Typography>
          ))}

        <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center" justifyContent="flex-end">
          <Button
            variant="outlined"
            color="secondary"
            disabled={isSubmitting || pendingStatus !== null}
            sx={{ px: 4 }}
            onClick={() => {
              setPendingStatus("draft");
              handleSubmit((data) => onSubmit(data, "draft"))().finally(() =>
                setPendingStatus(null)
              );
            }}
          >
            {pendingStatus === "draft"
              ? "Se salvează..."
              : editingJob
              ? "Actualizează anunțul"
              : "Salvează ciornă"}
          </Button>

          {!editingJob && (
            <Button
              variant="contained"
              color="primary"
              disabled={isSubmitting || pendingStatus !== null}
              sx={{ px: 4 }}
              onClick={() => {
                setPendingStatus("published");
                handleSubmit((data) => onSubmit(data, "published"))().finally(() =>
                  setPendingStatus(null)
                );
              }}
            >
              {pendingStatus === "published" ? "Se publică..." : "Publică anunț"}
            </Button>
          )}

          {onDelete && (
            <Button variant="outlined" color="error" onClick={onDelete}>
              Șterge
            </Button>
          )}
          {/* <Button variant="outlined" onClick={onCancel}>
            Anulează
          </Button> */}
        </Stack>
      </Stack>
    </Box>
  );
};
