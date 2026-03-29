"use client";

import React from "react";
import Link from "next/link";
import { Box, Container, Typography, Stack, useTheme } from "@mui/material";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";

const footerLinks = [
  { label: "Jobs", href: "/jobs" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Privacy Policy", href: "/policy" },
];

export const Footer: React.FC = () => {
  const theme = useTheme();
  const brandGradient =
    theme.palette.mode === "dark"
      ? "linear-gradient(135deg, #00f0ff 0%, #7b2ff7 100%)"
      : "linear-gradient(135deg, #00c2d1 0%, #7b2ff7 100%)";

  return (
    <Box
      component="footer"
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: "appBar",
        bgcolor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
        pt: 3,
        pb: 2,
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "center", md: "flex-start" }}
          spacing={3}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <WorkOutlineIcon sx={{ color: "primary.main", fontSize: 24 }} />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 800,
                background: brandGradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              LegalJobs
            </Typography>
          </Box>

          <Stack direction="row" spacing={3}>
            {footerLinks.map((link) => (
              <Typography
                key={link.href}
                component={Link}
                href={link.href}
                variant="body2"
                sx={{
                  color: "text.secondary",
                  textDecoration: "none",
                  "&:hover": { color: "primary.main" },
                }}
              >
                {link.label}
              </Typography>
            ))}
          </Stack>
        </Stack>

      </Container>
    </Box>
  );
};
