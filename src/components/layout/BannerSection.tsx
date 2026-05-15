"use client";

import React from "react";
import Link from "next/link";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import appSettings from "@/config/app.settings.json";

export function BannerSection() {
  return (
    <Box
      component="section"
      aria-labelledby="banner-cta-heading"
      sx={{
        py: { xs: 8, md: 12 },
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(195,174,97,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative" }}>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Box
            sx={{
              borderRadius: 4,
              bgcolor: "#03170C",
              border: "1px solid rgba(195,174,97,0.2)",
              backdropFilter: "blur(8px)",
              p: { xs: 4, md: 6 },
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: 3,
            }}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 18, color: "rgba(195,174,97,0.8)" }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(195,174,97,0.8)",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  Înregistrare gratuită
                </Typography>
              </Stack>
              <Typography
                variant="h3"
                component="h2"
                id="banner-cta-heading"
                sx={{ color: "#F0EBD8", mb: 0.5 }}
              >
                Gata să îți lansezi cariera?
              </Typography>
              <Typography sx={{ color: "rgba(240,235,216,0.5)" }}>
                Alătură-te profesioniștilor juridici activi pe platforma {appSettings.name}.
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ flexShrink: 0 }}>
              <Button
                component={Link}
                href="/anunt"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                aria-describedby="banner-cta-heading"
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 99,
                  fontWeight: 700,
                  bgcolor: "rgba(195,174,97,0.9)",
                  color: "white",
                  "&:hover": { bgcolor: "rgba(195,174,97,1)", boxShadow: "0 6px 24px rgba(195,174,97,0.3)" },
                }}
              >
                Postează primul anunț gratuit
              </Button>
              <Button
                component={Link}
                href="/jobs"
                variant="outlined"
                size="large"
                aria-describedby="banner-cta-heading"
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 99,
                  fontWeight: 600,
                  borderColor: "rgba(240,235,216,0.2)",
                  color: "rgba(240,235,216,0.7)",
                  "&:hover": { borderColor: "rgba(240,235,216,0.4)", bgcolor: "rgba(240,235,216,0.05)" },
                }}
              >
                Explorează anunțuri
              </Button>
            </Stack>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
