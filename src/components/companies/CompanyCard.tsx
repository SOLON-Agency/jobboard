"use client";

import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Stack,
  Chip,
  Box,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import type { Tables } from "@/types/database";

interface CompanyCardProps {
  company: Tables<"companies">;
  jobCount?: number;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  jobCount,
}) => (
  <Card
    component={Link}
    href={`/companies/${company.slug}`}
    sx={{
      textDecoration: "none",
      color: "inherit",
      display: "flex",
      "&:hover": {
        borderColor: "primary.main",
        transform: "translateY(-2px)",
        transition: "all 0.2s ease",
      },
    }}
  >
    <CardContent sx={{ p: 3, display: "flex", gap: 2, alignItems: "center", width: "100%" }}>
      <Avatar
        src={company.logo_url ?? undefined}
        sx={{
          width: 56,
          height: 56,
          bgcolor: "background.default",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <BusinessIcon sx={{ color: "text.secondary" }} />
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h5" noWrap>
          {company.name}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
          {company.location && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <LocationOnOutlinedIcon
                sx={{ fontSize: 14, color: "text.secondary" }}
              />
              <Typography variant="caption" color="text.secondary">
                {company.location}
              </Typography>
            </Stack>
          )}
          {company.industry && (
            <Chip label={company.industry} size="small" variant="outlined" />
          )}
        </Stack>
      </Box>
      {jobCount !== undefined && (
        <Chip
          label={`${jobCount} job${jobCount !== 1 ? "s" : ""}`}
          size="small"
          color="primary"
          variant="outlined"
        />
      )}
    </CardContent>
  </Card>
);
