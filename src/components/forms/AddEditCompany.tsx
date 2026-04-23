"use client";

import React, { useState, useImperativeHandle, forwardRef } from "react";
import { LocationAutocomplete } from "@/components/common/LocationAutocomplete";
import {
  Typography,
  TextField,
  Button,
  Stack,
  Box,
  Avatar,
  IconButton,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import BusinessIcon from "@mui/icons-material/Business";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { companySchema, type CompanyFormData } from "@/components/forms/validations/company.schema";
import type { CompanyWithJobCount } from "@/services/companies.service";

export type { CompanyFormData };

export interface AddEditCompanyHandle {
  submit: () => Promise<void>;
}

interface AddEditCompanyProps {
  editing: CompanyWithJobCount | null;
  defaultValues: CompanyFormData;
  initialLogoUrl?: string | null;
  onSubmit: (data: CompanyFormData, logoFile: File | null) => Promise<void>;
  onCancel: () => void;
  /** Hides built-in action buttons — caller controls submission via ref.submit() */
  hideActions?: boolean;
}

export const AddEditCompany = forwardRef<AddEditCompanyHandle, AddEditCompanyProps>(
  function AddEditCompany({ editing, defaultValues, initialLogoUrl, onSubmit, onCancel, hideActions }, ref) {
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(initialLogoUrl ?? null);

    const {
      handleSubmit,
      control,
      formState: { errors, isSubmitting },
    } = useForm<CompanyFormData>({
      resolver: zodResolver(companySchema),
      defaultValues,
    });

    useImperativeHandle(ref, () => ({
      submit: () => handleSubmit((data) => onSubmit(data, logoFile))(),
    }));

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setLogoFile(file);
      setLogoPreviewUrl(URL.createObjectURL(file));
    };

    return (
      <Box component="form" onSubmit={handleSubmit((data) => onSubmit(data, logoFile))} noValidate>
        <Stack spacing={2.5}>
          {/* Logo upload */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={logoPreviewUrl ?? undefined}
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: "background.default",
                  borderRadius: 0,
                }}
              >
                <BusinessIcon sx={{ fontSize: 32, color: "text.secondary" }} />
              </Avatar>
              <IconButton
                component="label"
                size="small"
                sx={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  "&:hover": { bgcolor: "action.hover" },
                }}
                title="Încarcă logo"
                aria-label="Încarcă logo companie"
              >
                <CameraAltIcon sx={{ fontSize: 14 }} />
                <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
              </IconButton>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                Logo companie
              </Typography>
              <Typography variant="caption" color="text.secondary">
                JPG, PNG sau SVG. Recomandat 200×200 px.
              </Typography>
            </Box>
          </Box>

          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Numele companiei"
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Descriere" fullWidth multiline rows={4} />
            )}
          />
          <Controller
            name="website"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Site web"
                fullWidth
                error={!!errors.website}
                helperText={errors.website?.message}
              />
            )}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Controller
              name="industry"
              control={control}
              render={({ field }) => <TextField {...field} label="Industrie" fullWidth />}
            />
            <Controller
              name="size"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Dimensiunea companiei"
                  fullWidth
                  placeholder="ex. 10-50"
                />
              )}
            />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <LocationAutocomplete
                  value={field.value}
                  onChange={field.onChange}
                  onInputChange={field.onChange}
                  onBlur={field.onBlur}
                  fullWidth
                />
              )}
            />
            <Controller
              name="founded_year"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Anul fondării"
                  type="number"
                  fullWidth
                  error={!!errors.founded_year}
                  helperText={errors.founded_year?.message}
                />
              )}
            />
          </Stack>

          {!hideActions && (
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end">
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                sx={{ px: 4 }}
              >
                {isSubmitting
                  ? "Se salvează..."
                  : editing
                    ? "Actualizează compania"
                    : "Creează companie"}
              </Button>
            </Stack>
          )}
        </Stack>
      </Box>
    );
  },
);
