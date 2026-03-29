"use client";

import React from "react";
import { Container, Typography, Box, Stack, Paper } from "@mui/material";

const steps = [
  {
    number: "01",
    title: "Create Your Profile",
    description:
      "Sign up, upload your CV, and fill in your experience details. Your profile helps employers understand your qualifications at a glance.",
  },
  {
    number: "02",
    title: "Browse & Search Jobs",
    description:
      "Use our powerful search and filter system to find positions that match your skills, location, and salary expectations.",
  },
  {
    number: "03",
    title: "Apply Directly",
    description:
      "Apply with one click using your saved profile, or fill out custom application forms. Track all your applications from your dashboard.",
  },
  {
    number: "04",
    title: "Set Up Alerts",
    description:
      "Save your search filters as alerts and receive notifications when new matching positions are posted.",
  },
];

const numberGradient = "linear-gradient(135deg, #03170C 0%, #3E5C76 100%)";
const badgeBg = "linear-gradient(135deg, rgba(3,23,12,0.08) 0%, rgba(62,92,118,0.1) 100%)";

export default function HowItWorksPage() {

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h2" sx={{ mb: 2, textAlign: "center" }}>
        How It Works
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 6, textAlign: "center", maxWidth: 500, mx: "auto" }}
      >
        Finding your next legal career opportunity is simple.
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
