"use client";

import React from "react";
import { Container, Typography, Box, Stack, Paper } from "@mui/material";

const steps = [
  {
    number: "01",
    title: "Creează-ți profilul",
    description:
      "Înregistrează-te, încarcă CV-ul și completează-ți experiența profesională. Profilul tău îi ajută pe angajatori să îți înțeleagă calificările dintr-o privire.",
  },
  {
    number: "02",
    title: "Caută și explorează joburi",
    description:
      "Folosește sistemul nostru avansat de căutare și filtrare pentru a găsi pozițiile care se potrivesc cu abilitățile, locația și așteptările tale salariale.",
  },
  {
    number: "03",
    title: "Aplică direct",
    description:
      "Aplică cu un singur click folosind profilul salvat sau completează formulare de candidatură personalizate. Urmărește toate aplicațiile din dashboard.",
  },
  {
    number: "04",
    title: "Configurează alerte",
    description:
      "Salvează filtrele de căutare ca alerte și primește notificări când apar noi poziții care corespund criteriilor tale.",
  },
];

const numberGradient = "linear-gradient(135deg, #03170C 0%, #3E5C76 100%)";
const badgeBg = "linear-gradient(135deg, rgba(3,23,12,0.08) 0%, rgba(62,92,118,0.1) 100%)";

export default function HowItWorksPage() {

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h2" sx={{ mb: 2, textAlign: "center" }}>
        Cum funcționează
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 6, textAlign: "center", maxWidth: 500, mx: "auto" }}
      >
        Găsirea următoarei oportunități în cariera ta juridică este simplă.
      </Typography>

      <Stack spacing={4}>
        {steps.map((step) => (
          <Paper
            key={step.number}
            sx={{
              p: 4,
              display: "flex",
              gap: 3,
              alignItems: "flex-start",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                minWidth: 56,
                height: 56,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: badgeBg,
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  background: numberGradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {step.number}
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {step.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {step.description}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Stack>
    </Container>
  );
}
