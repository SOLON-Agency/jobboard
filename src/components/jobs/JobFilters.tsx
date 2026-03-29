"use client";

import React, { useCallback, useState } from "react";
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
  Collapse,
  useMediaQuery,
  useTheme,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { jobTypeLabels, experienceLevelLabels } from "@/lib/utils";

export const JobFilters: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const activeFilterCount = ["q", "location", "type", "experience", "salaryMin", "remote"].filter(
    (k) => searchParams.has(k)
  ).length;

  const filtersBody = (
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
            <MenuItem key={value} value={value}>{label}</MenuItem>
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
            <MenuItem key={value} value={value}>{label}</MenuItem>
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

      {activeFilterCount > 0 && (
        <Button variant="text" onClick={clearFilters} size="small" sx={{ alignSelf: "flex-start" }}>
          Clear All Filters
        </Button>
      )}
    </Stack>
  );

  if (isDesktop) {
    return (
      <Box
        sx={{
          position: "sticky",
          top: 16,
          p: 3,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h5" sx={{ mb: 2 }}>Filters</Typography>
        {filtersBody}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: mobileOpen ? "primary.main" : "divider",
        bgcolor: "background.paper",
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
    >
      <Box
        component="button"
        onClick={() => setMobileOpen((prev) => !prev)}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          border: "none",
          bgcolor: "transparent",
          cursor: "pointer",
          color: "text.primary",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <FilterListIcon fontSize="small" sx={{ color: "text.secondary" }} />
          <Typography variant="body2" fontWeight={600}>Filters</Typography>
          {activeFilterCount > 0 && (
            <Chip label={activeFilterCount} size="small" color="primary" sx={{ height: 20, fontSize: 11 }} />
          )}
        </Stack>
        {mobileOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </Box>

      <Collapse in={mobileOpen}>
        <Box sx={{ px: 2, pb: 2 }}>
          {filtersBody}
        </Box>
      </Collapse>
    </Box>
  );
};
