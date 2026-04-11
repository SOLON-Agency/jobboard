"use client";

import React from "react";
import Link from "next/link";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { motion, type Variants } from "framer-motion";
import SearchIcon from "@mui/icons-material/Search";
import BusinessIcon from "@mui/icons-material/Business";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import appSettings from "@/config/app.settings.json";

// ── Features data ─────────────────────────────────────────────────────────────

const features = [
  {
    icon: <SearchIcon sx={{ fontSize: 28 }} />,
    title: "Căutare avansată",
    description:
      "Filtrează după locație, salariu, nivel de experiență, tip de contract și altele. Găsești exact ce cauți în câteva secunde.",
    color: "#3E5C76",
    lightBg: "rgba(62,92,118,0.06)",
    border: "rgba(62,92,118,0.15)",
  },
  {
    icon: <BusinessIcon sx={{ fontSize: 28 }} />,
    title: "Profiluri de companii",
    description:
      "Explorează firmele de avocatură de top și răsfoiește toate posturile disponibile într-un singur loc.",
    color: "#c3ae61",
    lightBg: "rgba(195,174,97,0.06)",
    border: "rgba(195,174,97,0.2)",
  },
  {
    icon: <ArticleOutlinedIcon sx={{ fontSize: 28 }} />,
    title: "Aplicare directă",
    description:
      "Trimite candidatura direct prin platformă cu formulare inteligente - daca ai profilul completat!",
    color: "#2d6a4f",
    lightBg: "rgba(45,106,79,0.06)",
    border: "rgba(45,106,79,0.15)",
  },
  {
    icon: <TrendingUpIcon sx={{ fontSize: 28 }} />,
    title: "Alerte inteligente",
    description:
      "Salvează filtrele ca alerte și primești notificări când apar noi poziții care corespund criteriilor tale.",
    color: "#748CAB",
    lightBg: "rgba(116,140,171,0.06)",
    border: "rgba(116,140,171,0.15)",
  },
];

// ── How it works steps ────────────────────────────────────────────────────────

const steps = [
  { number: "01", title: "Creează un cont gratuit", body: "Înregistrare simplă — fără card, fără costuri ascunse." },
  { number: "02", title: "Completează-ți profilul", body: "Adaugă experiența, educația și competențele pentru a fi remarcat." },
  { number: "03", title: "Aplică cu un singur click", body: "Găsește postul potrivit și trimite candidatura direct din platformă." },
];

// ── Framer variants ───────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut", delay: i * 0.1 },
  }),
};

// ── Component ─────────────────────────────────────────────────────────────────

export const FeaturesSection: React.FC = () => (
  <Box component="section">

    {/* ── Features grid ──────────────────────────────────────────────────────── */}
    <Box sx={{ bgcolor: "background.default", py: { xs: 10, md: 14 } }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <Typography
            variant="overline"
            sx={{ color: "primary.main", fontWeight: 700, letterSpacing: "0.2em", display: "block", mb: 1.5 }}
          >
            De ce să alegi {appSettings.name}
          </Typography>
          <Typography variant="h2" sx={{ mb: 2 }}>
            Tot ce ai nevoie pentru{" "}
            <Box
              component="span"
              sx={{
                background: "linear-gradient(135deg, #03170C 0%, #3E5C76 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              cariera ta juridică
            </Box>
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520, mx: "auto" }}>
            O platformă inteligentă construită special pentru juriști
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: 3,
          }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  height: "100%",
                  borderRadius: 3,
                  borderColor: f.border,
                  bgcolor: f.lightBg,
                  transition: "all 0.25s",
                  "&:hover": {
                    borderColor: f.color,
                    transform: "translateY(-4px)",
                    boxShadow: `0 12px 40px ${f.lightBg}`,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: f.lightBg,
                    border: `1px solid ${f.border}`,
                    color: f.color,
                    mb: 2.5,
                  }}
                >
                  {f.icon}
                </Box>
                <Typography variant="h5" sx={{ mb: 1, color: "text.primary" }}>
                  {f.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {f.description}
                </Typography>
              </Paper>
            </motion.div>
          ))}
        </Box>
      </Container>
    </Box>

    {/* ── How it works ───────────────────────────────────────────────────────── */}
    <Box
      sx={{
        py: { xs: 10, md: 14 },
        bgcolor: "#03170C",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* subtle grid texture */}
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
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <Typography
            variant="overline"
            sx={{ color: "rgba(195,174,97,0.8)", fontWeight: 700, letterSpacing: "0.2em", display: "block", mb: 1.5 }}
          >
            Simplu și rapid
          </Typography>
          <Typography variant="h2" sx={{ color: "#F0EBD8", mb: 2 }}>
            Cum funcționează
          </Typography>
          <Typography sx={{ color: "rgba(240,235,216,0.55)", maxWidth: 480, mx: "auto" }}>
            Trei pași simpli te separă de următoarea oportunitate din cariera ta juridică.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 4,
            mb: 8,
          }}
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              <Stack spacing={2}>
                <Typography
                  sx={{
                    fontSize: "3.5rem",
                    fontWeight: 800,
                    lineHeight: 1,
                    background: "linear-gradient(135deg, rgba(195,174,97,0.9) 0%, rgba(116,140,171,0.6) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {step.number}
                </Typography>
                <Box sx={{ width: 40, height: 2, bgcolor: "rgba(195,174,97,0.3)", borderRadius: 1 }} />
                <Typography variant="h4" sx={{ color: "#F0EBD8" }}>
                  {step.title}
                </Typography>
                <Typography sx={{ color: "rgba(240,235,216,0.55)", lineHeight: 1.7 }}>
                  {step.body}
                </Typography>
              </Stack>
            </motion.div>
          ))}
        </Box>

        {/* CTA block */}
        <motion.div
          variants={fadeUp}
          custom={3}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Box
            sx={{
              borderRadius: 4,
              border: "1px solid rgba(195,174,97,0.2)",
              bgcolor: "rgba(195,174,97,0.04)",
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
                  sx={{ color: "rgba(195,174,97,0.8)", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}
                >
                  Înregistrare gratuită
                </Typography>
              </Stack>
              <Typography variant="h3" sx={{ color: "#F0EBD8", mb: 0.5 }}>
                Gata să îți lansezi cariera?
              </Typography>
              <Typography sx={{ color: "rgba(240,235,216,0.5)" }}>
                Alătură-te celor peste 900 de profesioniști juridici activi pe platformă.
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ flexShrink: 0 }}>
              <Button
                component={Link}
                href="/anunt"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
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
  </Box>
);
