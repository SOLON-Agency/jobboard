"use client";

import React, { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Stack,
  Typography,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { jobTypeLabels, experienceLevelLabels } from "@/lib/utils";

export const JobFilters: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | boolean | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "" || value === false) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearFilters = () => router.push(pathname);

  const hasFilters = searchParams.toString().length > 0;

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Typography variant="h5" sx={{ mb: 2 }}>
        Filters
      </Typography>

      <Stack spacing={2.5}>
        <TextField
          placeholder="Search jobs..."
          size="small"
          defaultValue={searchParams.get("q") ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateParam("q", (e.target as HTMLInputElement).value);
            }
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          label="Location"
          size="small"
          defaultValue={searchParams.get("location") ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateParam("location", (e.target as HTMLInputElement).value);
            }
          }}
        />

        <FormControl size="small">
          <InputLabel>Job Type</InputLabel>
          <Select
            label="Job Type"
            value={searchParams.get("type") ?? ""}
            onChange={(e) => updateParam("type", e.target.value || null)}
          >
            <MenuItem value="">All Types</MenuItem>
            {Object.entries(jobTypeLabels).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel>Experience</InputLabel>
          <Select
            label="Experience"
            value={searchParams.get("experience") ?? ""}
            onChange={(e) => updateParam("experience", e.target.value || null)}
          >
            <MenuItem value="">All Levels</MenuItem>
            {Object.entries(experienceLevelLabels).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Min Salary"
          size="small"
          type="number"
          defaultValue={searchParams.get("salaryMin") ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateParam("salaryMin", (e.target as HTMLInputElement).value || null);
            }
          }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={searchParams.get("remote") === "true"}
              onChange={(e) => updateParam("remote", e.target.checked || null)}
              color="primary"
            />
          }
          label="Remote Only"
        />

        {hasFilters && (
          <Button variant="text" onClick={clearFilters} size="small">
            Clear All Filters
          </Button>
        )}
      </Stack>
    </Box>
  );
};
