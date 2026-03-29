"use client";

import React, { useCallback, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Box,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Stack,
  Typography,
  InputAdornment,
  Collapse,
  Divider,
  Slider,
  Chip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import FilterListIcon from "@mui/icons-material/FilterList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { jobTypeLabels, experienceLevelLabels } from "@/lib/utils";
import appSettings from "@/config/app.settings.json";

const SALARY_MAX = appSettings.config.salaryMax ?? 30000;
const SALARY_MIN = appSettings.config.salaryMin ?? 5000;
const SALARY_STEP = 5_000;

const jobTypeColors: Record<string, "success" | "warning" | "info" | "secondary" | "default"> = {
  "full-time":  "success",
  "part-time":  "warning",
  contract:     "info",
  internship:   "secondary",
  freelance:    "default",
};

type SectionKey = "location" | "jobType" | "experience" | "salary" | "remote";

const SectionHeader: React.FC<{
  label: string;
  open: boolean;
  onToggle: () => void;
}> = ({ label, open, onToggle }) => (
  <Box
    component="button"
    onClick={onToggle}
    sx={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      py: 1.5,
      px: 0,
      border: "none",
      bgcolor: "transparent",
      cursor: "pointer",
      color: "text.primary",
    }}
  >
    <Typography variant="body2" fontWeight={600}>
      {label}
    </Typography>
    <Box
      sx={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        bgcolor: open ? "primary.main" : "action.selected",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "background-color 0.2s",
      }}
    >
      {open
        ? <RemoveIcon sx={{ fontSize: 14, color: open ? "primary.contrastText" : "text.secondary" }} />
        : <AddIcon    sx={{ fontSize: 14, color: "text.secondary" }} />
      }
    </Box>
  </Box>
);

export const JobFilters: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    location:   true,
    jobType:    false,
    experience: false,
    salary:     true,
    remote:     false,
  });

  const toggle = (key: SectionKey) =>
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const initialSalary: [number, number] = [
    searchParams.get("salaryMin") ? Number(searchParams.get("salaryMin")) : appSettings.config.salaryMin ?? SALARY_MIN,
    searchParams.get("salaryMax") ? Number(searchParams.get("salaryMax")) : appSettings.config.salaryMax ?? SALARY_MAX,
  ];
  const [salaryRange, setSalaryRange] = useState<[number, number]>(initialSalary);

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

  const clearFilters = () => {
    setSalaryRange([0, SALARY_MAX]);
    router.push(pathname);
  };

  const activeFilterCount = ["q", "location", "type", "experience", "salaryMin", "salaryMax", "remote"].filter(
    (k) => searchParams.has(k)
  ).length;

  const selectedType = searchParams.get("type") ?? "";
  const selectedExp  = searchParams.get("experience") ?? "";

  const fmt = (v: number) =>
    v >= 1000 ? `${appSettings.config.currency}${v / 1000}k` : `${appSettings.config.currency}${v}`;

  const filtersBody = (
    <Stack divider={<Divider />}>
      {/* Location */}
      <Box>
        <SectionHeader label="Locație" open={open.location} onToggle={() => toggle("location")} />
        <Collapse in={open.location}>
          <Box sx={{ pb: 2 }}>
            <TextField
              placeholder="Oraș, țară..."
              size="small"
              fullWidth
              defaultValue={searchParams.get("location") ?? ""}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  updateParam("location", (e.target as HTMLInputElement).value);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
        </Collapse>
      </Box>

      {/* Job Type */}
      <Box>
        <SectionHeader label="Tip de contract" open={open.jobType} onToggle={() => toggle("jobType")} />
        <Collapse in={open.jobType}>
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ pb: 2 }}>
            {Object.entries(jobTypeLabels).map(([value, label]) => (
              <Chip
                key={value}
                label={label}
                size="small"
                color={selectedType === value ? jobTypeColors[value] : "default"}
                variant={selectedType === value ? "filled" : "outlined"}
                onClick={() => updateParam("type", selectedType === value ? null : value)}
                sx={{ cursor: "pointer" }}
              />
            ))}
          </Stack>
        </Collapse>
      </Box>

      {/* Experience */}
      <Box>
        <SectionHeader label="Experiență" open={open.experience} onToggle={() => toggle("experience")} />
        <Collapse in={open.experience}>
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ pb: 2 }}>
            {Object.entries(experienceLevelLabels).map(([value, label]) => (
              <Chip
                key={value}
                label={label}
                size="small"
                color={selectedExp === value ? "primary" : "default"}
                variant={selectedExp === value ? "filled" : "outlined"}
                onClick={() => updateParam("experience", selectedExp === value ? null : value)}
                sx={{ cursor: "pointer" }}
              />
            ))}
          </Stack>
        </Collapse>
      </Box>

      {/* Salary */}
      <Box>
        <SectionHeader label="Salariu" open={open.salary} onToggle={() => toggle("salary")} />
        <Collapse in={open.salary}>
          <Box sx={{ pb: 2, px: 1 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">{fmt(salaryRange[0])}</Typography>
              <Typography variant="caption" color="text.secondary">{fmt(salaryRange[1])}{salaryRange[1] === SALARY_MAX ? "+" : ""}</Typography>
            </Stack>
            <Slider
              value={salaryRange}
              min={0}
              max={SALARY_MAX}
              step={SALARY_STEP}
              onChange={(_, v) => setSalaryRange(v as [number, number])}
              onChangeCommitted={(_, v) => {
                const [min, max] = v as [number, number];
                const params = new URLSearchParams(searchParams.toString());
                if (min > 0) params.set("salaryMin", String(min)); else params.delete("salaryMin");
                if (max < SALARY_MAX) params.set("salaryMax", String(max)); else params.delete("salaryMax");
                params.delete("page");
                router.push(`${pathname}?${params.toString()}`);
              }}
              size="small"
              color="primary"
            />
          </Box>
        </Collapse>
      </Box>

      {/* Remote */}
      <Box>
        <SectionHeader label="La distanță" open={open.remote} onToggle={() => toggle("remote")} />
        <Collapse in={open.remote}>
          <Box sx={{ pb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={searchParams.get("remote") === "true"}
                  onChange={(e) => updateParam("remote", e.target.checked || null)}
                  color="primary"
                  size="small"
                />
              }
              label={<Typography variant="body2">Doar remote</Typography>}
            />
          </Box>
        </Collapse>
      </Box>
    </Stack>
  );

  const searchBar = (
    <Box sx={{ mb: 2 }}>
      <TextField
        placeholder="Caută locuri de muncă..."
        size="small"
        fullWidth
        defaultValue={searchParams.get("q") ?? ""}
        onKeyDown={(e) => {
          if (e.key === "Enter")
            updateParam("q", (e.target as HTMLInputElement).value);
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
    </Box>
  );

  if (isDesktop) {
    return (
      <Box
        sx={{
          position: "sticky",
          top: 16,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: 2.5, pt: 2.5, pb: 0 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
            Filtrează după
          </Typography>
          {searchBar}
        </Box>
        <Box sx={{ px: 2.5 }}>{filtersBody}</Box>
        <Box sx={{ p: 2.5 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={clearFilters}
            disabled={activeFilterCount === 0}
            sx={{ borderRadius: 2, py: 1 }}
          >
            Resetează filtrele{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </Button>
        </Box>
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
        onClick={() => setMobileOpen((p) => !p)}
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
          <Typography variant="body2" fontWeight={600}>Filtrează după</Typography>
          {activeFilterCount > 0 && (
            <Chip label={activeFilterCount} size="small" color="primary" sx={{ height: 20, fontSize: 11 }} />
          )}
        </Stack>
        {mobileOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </Box>
      <Collapse in={mobileOpen}>
        <Box sx={{ px: 2, pb: 2 }}>
          {searchBar}
          {filtersBody}
          <Button
            variant="contained"
            fullWidth
            onClick={clearFilters}
            disabled={activeFilterCount === 0}
            sx={{ mt: 2, borderRadius: 2 }}
          >
            Resetează filtrele{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
};
