"use client";

import React from "react";
import Link from "next/link";
import { Box, Container, Typography, Button, Stack } from "@mui/material";

const headingGradient = "linear-gradient(135deg, #03170C 0%, #3E5C76 55%, #748CAB 100%)";
const glowGradient = "radial-gradient(circle, rgba(195,174,97,0.12) 0%, rgba(62,92,118,0.06) 50%, transparent 70%)";

export const HeroSection: React.FC = () => {

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
          Platforma ta de carieră juridică
        </Typography>

        <Typography
          variant="h5"
          color="text.secondary"
          sx={{ mb: 5, fontWeight: 400, maxWidth: 600, mx: "auto" }}
        >
          Explorează sute de posturi juridice de la firme de top. Aplică direct,
          setează alerte și preia controlul carierei tale.
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
            Explorează locuri de muncă
          </Button>
          <Button
            component={Link}
            href="/register"
            variant="outlined"
            size="large"
            sx={{ px: 4, py: 1.5 }}
          >
            Creează cont
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};
