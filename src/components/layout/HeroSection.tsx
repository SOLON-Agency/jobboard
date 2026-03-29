"use client";

import React from "react";
import Link from "next/link";
import { Box, Container, Typography, Button, Stack, useTheme } from "@mui/material";

export const HeroSection: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const headingGradient = isDark
    ? "linear-gradient(135deg, #e2e8f0 0%, #00f0ff 50%, #7b2ff7 100%)"
    : "linear-gradient(135deg, #0f172a 0%, #00c2d1 50%, #7b2ff7 100%)";

  const glowGradient = isDark
    ? "radial-gradient(circle, rgba(0,240,255,0.08) 0%, rgba(123,47,247,0.04) 50%, transparent 70%)"
    : "radial-gradient(circle, rgba(0,194,209,0.1) 0%, rgba(123,47,247,0.05) 50%, transparent 70%)";

  return (
    <Box
      sx={{
        pt: { xs: 10, md: 16 },
        pb: { xs: 8, md: 14 },
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: glowGradient,
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="md" sx={{ position: "relative", textAlign: "center" }}>
        <Typography
          variant="h1"
          sx={{
            mb: 3,
            fontSize: { xs: "2.25rem", md: "3.5rem" },
            background: headingGradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Your Next Legal Career Move Starts Here
        </Typography>

        <Typography
          variant="h5"
          color="text.secondary"
          sx={{ mb: 5, fontWeight: 400, maxWidth: 600, mx: "auto" }}
        >
          Browse hundreds of legal positions from top firms. Apply directly,
          set up alerts, and take control of your career.
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="center"
        >
          <Button
            component={Link}
            href="/jobs"
            variant="contained"
            size="large"
            sx={{ px: 4, py: 1.5 }}
          >
            Browse Jobs
          </Button>
          <Button
            component={Link}
            href="/register"
            variant="outlined"
            size="large"
            sx={{ px: 4, py: 1.5 }}
          >
            Create Account
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};
