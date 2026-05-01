"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Box, Container, Typography, Stack } from "@mui/material";
import appSettings from "@/config/app.settings.json";

const footerLinks = [
  // { label: "Anunțuri", href: "/jobs" },
  { label: "Cum funcționează", href: "/how-it-works" },
  { label: "Politică de confidențialitate", href: "/policy" },
];

export function Footer() {
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
          alignItems="center"
          spacing={3}
        >
          <Box
            component={Link}
            href="/"
            aria-label={`${appSettings.name} — pagina principală`}
            sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
          >
            <Image
              src="/footer-logo.png"
              alt={`${appSettings.name} logo`}
              width={480}
              height={160}
              priority={false}
              style={{ width: "auto", height: 44, objectFit: "contain" }}
            />
          </Box>

          <Box component="nav" aria-label="Linkuri utile">
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
                    textUnderlineOffset: 4,
                    transition: "color 0.2s ease, text-decoration-color 0.2s ease",
                    "&:hover": {
                      color: "primary.main",
                      textDecoration: "underline",
                      textDecorationThickness: "2px",
                    },
                    "&:focus-visible": {
                      color: "primary.main",
                      textDecoration: "underline",
                      textDecorationThickness: "2px",
                      outline: "none",
                    },
                  }}
                >
                  {link.label}
                </Typography>
              ))}
            </Stack>
          </Box>
        </Stack>

      </Container>
    </Box>
  );
};
