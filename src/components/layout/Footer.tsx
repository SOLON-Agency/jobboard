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
          alignItems={{ xs: "center", md: "flex-start" }}
          spacing={3}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/* <Image
              src="/logo-light.png"
              alt={`${appSettings.name} logo`}
              width={200}
              height={110}
              priority={false}
              style={{ width: "auto", height: 20 }}
            /> */}
            <Typography variant="body2" fontWeight={700} sx={{ textTransform: "uppercase" }}>{appSettings.name}</Typography>
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
                    "&:hover": { color: "primary.main" },
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
