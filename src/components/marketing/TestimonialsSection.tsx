"use client";

import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import appSettings from "@/config/app.settings.json";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  context: string;
  initials: string;
  accent: string;
  bg: string;
}

const testimonials: readonly Testimonial[] = [
  {
    quote:
      "Am închis două poziții de avocat senior în mai puțin de trei săptămâni. Calitatea candidaților care aplică pe platformă este vizibil superioară boardurilor generaliste.",
    author: "Andreea P.",
    role: "Managing Partner",
    context: "Societate de avocatură, București",
    initials: "AP",
    accent: "#c3ae61",
    bg: "rgba(195,174,97,0.08)",
  },
  {
    quote:
      "Faptul că aplicațiile vin de la profesioniști cu profil complet și experiență relevantă pentru rolurile noastre in-house a schimbat complet ritmul echipei de HR.",
    author: "Mihai R.",
    role: "Head of Legal & Compliance",
    context: "Grup financiar, Cluj-Napoca",
    initials: "MR",
    accent: "#3E5C76",
    bg: "rgba(62,92,118,0.08)",
  },
  {
    quote:
      "Mi-am construit profilul în 15 minute și a doua zi aveam deja două interviuri programate. Transparența salarială m-a ajutat să negociez fără presiune.",
    author: "Iulia D.",
    role: "Avocat definitiv",
    context: "Drept comercial, Timișoara",
    initials: "ID",
    accent: "#2d6a4f",
    bg: "rgba(45,106,79,0.08)",
  },
] as const;

export function TestimonialsSection() {
  return (
    <Box
      component="section"
      aria-labelledby="testimonials-section-heading"
      sx={{ bgcolor: "background.default", py: { xs: 10, md: 14 } }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: { xs: 6, md: 8 }, maxWidth: 720, mx: "auto" }}>
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
            Voci din comunitatea juridică
          </Typography>
          <Typography
            id="testimonials-section-heading"
            variant="h2"
            component="h2"
            sx={{ mb: 2, fontSize: { xs: "1.85rem", sm: "2.2rem", md: "2.6rem", lg: "3rem" } }}
          >
            Ce spun{" "}
            <Box
              component="span"
              sx={{
                background: "linear-gradient(135deg, #03170C 0%, #c3ae61 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              profesioniștii
            </Box>{" "}
            despre {appSettings.name}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ lineHeight: 1.75, fontSize: { xs: "1rem", md: "1.1rem" } }}
          >
            Recrutori, parteneri de firme și avocați aflați în pragul unei noi etape de
            carieră — povești reale dintr-o piață juridică în plină modernizare.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(3, 1fr)",
            },
            gap: { xs: 3, md: 3.5 },
          }}
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={t.author}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              <Paper
                variant="outlined"
                sx={{
                  position: "relative",
                  p: { xs: 3, md: 4 },
                  height: "100%",
                  borderRadius: 3,
                  borderColor: "rgba(3,23,12,0.08)",
                  bgcolor: t.bg,
                  transition: "all 0.25s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 14px 40px rgba(3,23,12,0.08)",
                  },
                }}
              >
                <FormatQuoteIcon
                  aria-hidden
                  sx={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    fontSize: 56,
                    color: t.accent,
                    opacity: 0.22,
                  }}
                />

                <Typography
                  component="blockquote"
                  sx={{
                    color: "text.primary",
                    fontSize: { xs: "1rem", md: "1.05rem" },
                    lineHeight: 1.75,
                    fontStyle: "italic",
                    mb: 3,
                    pr: 4,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  „{t.quote}”
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    aria-hidden
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: t.accent,
                      color: "#03170C",
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      letterSpacing: "0.04em",
                      flexShrink: 0,
                    }}
                  >
                    {t.initials}
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        color: "text.primary",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                      }}
                    >
                      {t.author}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", fontSize: "0.85rem" }}
                    >
                      {t.role}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        opacity: 0.8,
                        display: "block",
                        fontSize: "0.75rem",
                      }}
                    >
                      {t.context}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </motion.div>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
