"use client";

import React from "react";
import { Autocomplete, TextField } from "@mui/material";
import type { FilterOptionsState } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import citiesData from "@/data/ro_cities.json";

const CITY_OPTIONS: readonly string[] = citiesData.map((c) => c.city);

function filterCities(options: readonly string[], state: FilterOptionsState<string>): string[] {
  const q = state.inputValue.trim().toLowerCase();
  if (!q) return [];
  return (options as string[]).filter((o) => o.toLowerCase().includes(q)).slice(0, 50);
}

interface LocationAutocompleteProps {
  value?: string | null;
  /** Called when the user selects a city from the dropdown. */
  onChange: (value: string) => void;
  /**
   * Called on every keystroke so RHF-controlled fields stay in sync
   * even when the user types a free value without selecting from the list.
   */
  onInputChange?: (value: string) => void;
  onBlur?: () => void;
  label?: string;
  placeholder?: string;
  size?: "small" | "medium";
  fullWidth?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  "aria-label"?: string;
  sx?: SxProps<Theme>;
}

export function LocationAutocomplete({
  value,
  onChange,
  onInputChange,
  onBlur,
  label = "Locație",
  placeholder = "Oraș...",
  size = "medium",
  fullWidth = true,
  error,
  helperText,
  disabled,
  "aria-label": ariaLabel,
  sx,
}: LocationAutocompleteProps) {
  return (
    <Autocomplete
      options={CITY_OPTIONS as string[]}
      value={value ?? null}
      onChange={(_, newValue) => onChange((newValue as string | null) ?? "")}
      onInputChange={(_, newInputValue) => onInputChange?.(newInputValue)}
      onBlur={onBlur}
      disabled={disabled}
      freeSolo
      autoHighlight
      filterOptions={filterCities}
      noOptionsText="Nu au fost găsite orașe"
      fullWidth={fullWidth}
      sx={{ minWidth: 200, ...sx }}
      slotProps={{
        paper: { sx: { minWidth: 260 } },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          size={size}
          fullWidth={fullWidth}
          error={error}
          helperText={helperText}
          inputProps={{
            ...params.inputProps,
            "aria-label": ariaLabel,
          }}
        />
      )}
    />
  );
}
