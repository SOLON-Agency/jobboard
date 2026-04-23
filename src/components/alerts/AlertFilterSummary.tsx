"use client";

import React from "react";
import { Stack, Chip, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { jobTypeLabels, experienceLevelLabels } from "@/lib/utils";
import appSettings from "@/config/app.settings.json";
import type { AlertFilters } from "@/services/alerts.service";

interface AlertFilterSummaryProps {
  filters: AlertFilters;
  sx?: SxProps<Theme>;
}

const fmt = (v: number) =>
  v >= 1000
    ? `${appSettings.config.currency}${v / 1000}k`
    : `${appSettings.config.currency}${v}`;

export function AlertFilterSummary({ filters, sx }: AlertFilterSummaryProps) {
  const chips: { key: string; label: string }[] = [];

  if (filters.q)          chips.push({ key: "q",          label: `Cuvinte cheie: ${filters.q}` });
  if (filters.location)   chips.push({ key: "location",   label: `Locație: ${filters.location}` });
  if (filters.type)       chips.push({ key: "type",       label: `Tip: ${jobTypeLabels[filters.type] ?? filters.type}` });
  if (filters.experience) chips.push({ key: "experience", label: `Experiență: ${experienceLevelLabels[filters.experience] ?? filters.experience}` });

  if (filters.salaryMin != null || filters.salaryMax != null) {
    const min = filters.salaryMin != null ? fmt(filters.salaryMin) : "0";
    const max = filters.salaryMax != null ? fmt(filters.salaryMax) : "∞";
    chips.push({ key: "salary", label: `Salariu: ${min} – ${max}` });
  }

  if (filters.remote === true)  chips.push({ key: "remote", label: "La distanță" });
  if (filters.remote === false) chips.push({ key: "remote", label: "Doar la birou" });

  if (filters.minBenefits && filters.minBenefits > 0)
    chips.push({ key: "benefits", label: `Min. beneficii: ${filters.minBenefits}+` });

  if (chips.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        Toate anunțurile
      </Typography>
    );
  }

  return (
    <Stack direction="row" flexWrap="wrap" gap={0.75} sx={sx}>
      {chips.map(({ key, label }) => (
        <Chip key={key} label={label} size="small" variant="outlined" />
      ))}
    </Stack>
  );
}
