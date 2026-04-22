"use client";

import React from "react";
import { Box, Stack, type SxProps, type Theme } from "@mui/material";

export interface DashboardPageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /**
   * When true, actions align to the top on `md+` (e.g. back link + long title + side action).
   */
  alignTop?: boolean;
  sx?: SxProps<Theme>;
  responsive?: boolean;
}

export function DashboardPageHeader({
  title,
  subtitle,
  actions,
  alignTop = false,
  sx,
  responsive = true,
}: DashboardPageHeaderProps) {
  return (
  <Stack
    direction={responsive ? { xs: "column", md: "row" } : "row"}
    justifyContent="space-between"
    alignItems={{
      xs: "flex-start",
      md: alignTop ? "flex-start" : "center",
    }}
    spacing={{ xs: 2, md: 0 }}
    gap={{ md: 2 }}
    sx={{ mb: 2, ...sx }}
  >
    <Box sx={{ minWidth: 0, flex: { md: alignTop ? 1 : "0 1 auto" } }}>
      {title}
      {subtitle != null && <Box sx={{ mt: 0.5 }}>{subtitle}</Box>}
    </Box>
    {actions != null ? (
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        sx={{
          width: { xs: "100%", md: "auto" },
          justifyContent: { xs: "flex-start", md: "flex-end" },
          flexShrink: 0,
        }}
      >
        {actions}
      </Stack>
    ) : null}
  </Stack>
);
}