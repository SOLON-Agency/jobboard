"use client";

import React from "react";
import Link from "next/link";
import { Box, Container, Typography, Stack, useTheme } from "@mui/material";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import appSettings from "@/config/app.settings.json";

const footerLinks = [
  { label: "Anunțuri", href: "/jobs" },
  // { label: "Cum funcționează", href: "/how-it-works" },
  { label: "Politică de confidențialitate", href: "/policy" },
];

export const Footer: React.FC = () => {
  const theme = useTheme();
  const brandGradient =
    theme.palette.mode === "dark"
      ? "linear-gradient(135deg, #748CAB 0%, #c3ae61 100%)"
      : "linear-gradient(135deg, #03170C 0%, #3E5C76 100%)";

  return (
    <Box
      component="footer"
      sx={{
        position: "relative",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "background.paper",
      }}
    >
      <Container maxWidth="lg" sx={{ paddingBottom: 2, paddingTop: 2 }}>
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
              {appSettings.name}
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
