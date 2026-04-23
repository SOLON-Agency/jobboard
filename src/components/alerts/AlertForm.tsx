"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  FormHelperText,
  InputAdornment,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { alertSchema, type AlertFormData } from "@/components/forms/validations/alert.schema";
import { jobTypeLabels, experienceLevelLabels } from "@/lib/utils";
import appSettings from "@/config/app.settings.json";
import type { JobType, ExperienceLevel } from "@/types";

const SALARY_MIN = appSettings.config.salaryMin ?? 5000;
const SALARY_MAX = appSettings.config.salaryMax ?? 30000;
const SALARY_STEP = 5_000;

const fmt = (v: number) =>
  v >= 1000
    ? `${appSettings.config.currency}${v / 1000}k`
    : `${appSettings.config.currency}${v}`;

const JOB_TYPES = Object.keys(jobTypeLabels) as JobType[];
const EXPERIENCE_LEVELS = Object.keys(experienceLevelLabels) as ExperienceLevel[];

interface AlertFormProps {
  defaultValues?: Partial<AlertFormData>;
  onSubmit: (data: AlertFormData) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
}

export function AlertForm({
  defaultValues,
  onSubmit,
  submitLabel = "Salvează alerta",
  onCancel,
}: AlertFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      name: "",
      q: "",
      location: "",
      salaryMin: undefined,
      salaryMax: undefined,
      minBenefits: 0,
      remote: undefined,
      ...defaultValues,
    },
  });

  const salaryMin = watch("salaryMin");
  const salaryMax = watch("salaryMax");
  const minBenefits = watch("minBenefits") ?? 0;
  const selectedType = watch("type");
  const selectedExp = watch("experience");
  const remote = watch("remote");

  const sliderValue: [number, number] = [salaryMin ?? 0, salaryMax ?? SALARY_MAX];

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      aria-label="Formular creare alertă"
    >
      <Stack spacing={3}>
        {/* Alert name */}
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Numele alertei"
              required
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message ?? "Ex: Avocat senior București"}
              inputProps={{ "aria-describedby": errors.name ? "name-error" : undefined, "aria-required": true }}
            />
          )}
        />

        <Divider>
          <Typography variant="caption" color="text.secondary">
            Filtre
          </Typography>
        </Divider>

        {/* Keyword */}
        <Controller
          name="q"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Cuvinte cheie"
              placeholder="Ex: avocat, paralegal..."
              fullWidth
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
        />

        {/* Location */}
        <Controller
          name="location"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Locație"
              placeholder="Oraș, țară..."
              fullWidth
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
        />

        {/* Job type */}
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            Tip de contract
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {JOB_TYPES.map((value) => (
              <Chip
                key={value}
                label={jobTypeLabels[value]}
                size="small"
                variant={selectedType === value ? "filled" : "outlined"}
                color={selectedType === value ? "primary" : "default"}
                onClick={() =>
                  setValue("type", selectedType === value ? undefined : value, { shouldValidate: true })
                }
                sx={{ cursor: "pointer" }}
              />
            ))}
          </Stack>
        </Box>

        {/* Experience level */}
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            Nivel de experiență
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {EXPERIENCE_LEVELS.map((value) => (
              <Chip
                key={value}
                label={experienceLevelLabels[value]}
                size="small"
                variant={selectedExp === value ? "filled" : "outlined"}
                color={selectedExp === value ? "primary" : "default"}
                onClick={() =>
                  setValue("experience", selectedExp === value ? undefined : value, { shouldValidate: true })
                }
                sx={{ cursor: "pointer" }}
              />
            ))}
          </Stack>
        </Box>

        {/* Salary range */}
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            Interval salarial
          </Typography>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {fmt(sliderValue[0])}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {fmt(sliderValue[1])}{sliderValue[1] === SALARY_MAX ? "+" : ""}
            </Typography>
          </Stack>
          <Slider
            value={sliderValue}
            min={0}
            max={SALARY_MAX}
            step={SALARY_STEP}
            aria-label="Interval salariu"
            getAriaValueText={(v) => fmt(v)}
            onChange={(_, v) => {
              const [min, max] = v as [number, number];
              setValue("salaryMin", min > 0 ? min : undefined, { shouldValidate: true });
              setValue("salaryMax", max < SALARY_MAX ? max : undefined, { shouldValidate: true });
            }}
            size="small"
            color="primary"
          />
          {errors.salaryMax && (
            <FormHelperText error>{errors.salaryMax.message}</FormHelperText>
          )}
        </Box>

        {/* Min benefits */}
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            Număr minim de beneficii
          </Typography>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">Minim</Typography>
            <Typography variant="caption" fontWeight={700} color={minBenefits > 0 ? "primary.main" : "text.secondary"}>
              {minBenefits === 0 ? "Orice" : `${minBenefits}+`}
            </Typography>
          </Stack>
          <Slider
            value={minBenefits}
            min={0}
            max={10}
            step={1}
            marks
            aria-label="Număr minim de beneficii"
            getAriaValueText={(v) => (v === 0 ? "Orice" : `${v}+`)}
            onChange={(_, v) =>
              setValue("minBenefits", v as number, { shouldValidate: true })
            }
            size="small"
            color="success"
          />
        </Box>

        {/* Remote */}
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Mod de lucru
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={remote === true}
                onChange={(e) =>
                  setValue("remote", e.target.checked ? true : undefined, { shouldValidate: true })
                }
                color="primary"
                size="small"
              />
            }
            label={<Typography variant="body2">Doar la distanță</Typography>}
          />
          <FormControlLabel
            control={
              <Switch
                checked={remote === false}
                onChange={(e) =>
                  setValue("remote", e.target.checked ? false : undefined, { shouldValidate: true })
                }
                color="primary"
                size="small"
              />
            }
            label={<Typography variant="body2">Doar la birou</Typography>}
          />
        </Box>

        {/* Actions */}
        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          {onCancel && (
            <Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
              Anulează
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Se salvează…" : submitLabel}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
