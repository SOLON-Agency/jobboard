"use client";

import React from "react";
import { Box, Container, Paper, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import SearchIcon from "@mui/icons-material/Search";
import BusinessIcon from "@mui/icons-material/Business";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import appSettings from "@/config/app.settings.json";

const features = [
  {
    icon: <ArticleOutlinedIcon sx={{ fontSize: 28 }} />,
    title: "Gestionare profil",
    description:
      `Gestionează profilul tău și toate aplicațiile tale la toate joburile juridice - direct prin platforma ${appSettings.name}.`,
    color: "#2d6a4f",
    lightBg: "rgba(45,106,79,0.06)",
    border: "rgba(45,106,79,0.15)",
  },
  {
    icon: <BusinessIcon sx={{ fontSize: 28 }} />,
    title: "Profiluri de companii",
    description:
      "Explorează firmele de avocatură de top și răsfoiește toate posturile disponibile ale unei companii într-un singur loc.",
    color: "#c3ae61",
    lightBg: "rgba(195,174,97,0.06)",
    border: "rgba(195,174,97,0.2)",
  },
  {
    icon: <SearchIcon sx={{ fontSize: 28 }} />,
    title: "Căutare avansată",
    description:
      "Filtrează după locație, salariu, nivel de experiență, tip de contract, beneficii și altele. Găsești exact ce cauți.",
    color: "#3E5C76",
    lightBg: "rgba(62,92,118,0.06)",
    border: "rgba(62,92,118,0.15)",
  },
  {
    icon: <TrendingUpIcon sx={{ fontSize: 28 }} />,
    title: "Alerte inteligente",
    description:
      "Salvează filtrele de căutare ca alerte și primești notificări când apar noi oportunități care corespund criteriilor tale.",
    color: "#748CAB",
    lightBg: "rgba(116,140,171,0.06)",
    border: "rgba(116,140,171,0.15)",
  },
];

export function WhySection() {
  return (
    <Box
      component="section"
      aria-labelledby="why-section-heading"
      sx={{ bgcolor: "background.default", py: { xs: 10, md: 14 } }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <Typography
            variant="overline"
            sx={{
              color: "primary.main",
              fontWeight: 700,
              letterSpacing: "0.2em",
              display: "block",
              mb: 1.5,
            }}
          >
            De ce să alegi {appSettings.name}?
          </Typography>
          <Typography id="why-section-heading" variant="h2" sx={{ mb: 2 }}>
            O platformă inteligentă pentru{" "}
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
                <Typography variant="h5" component="h3" sx={{ mb: 1, color: "text.primary" }}>
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
  );
}
