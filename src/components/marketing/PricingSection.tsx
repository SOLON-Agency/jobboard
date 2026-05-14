"use client";

import Link from "next/link";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import appSettings from "@/config/app.settings.json";

const includedFeatures: readonly string[] = [
  "Până la 5 anunțuri active gratuite, fără card de credit",
  "Profil de companie complet, cu logo, descriere și beneficii",
  "Acces la candidați verificați și la dashboard-ul de aplicații",
  "Anunțuri afișate cu interval salarial și pachet de beneficii",
  "Notificări instant când candidații aplică sau își retrag aplicația",
  "Asistență la onboarding pentru primul tău anunț publicat",
] as const;

export function PricingSection() {
  return (
    <Box
      component="section"
      aria-labelledby="pricing-section-heading"
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
            Acces gratuit pentru angajatori
          </Typography>
          <Typography
            id="pricing-section-heading"
            variant="h2"
            component="h2"
            sx={{ mb: 2, fontSize: { xs: "1.85rem", sm: "2.2rem", md: "2.6rem", lg: "3rem" } }}
          >
            Publici{" "}
            <Box
              component="span"
              sx={{
                background: "linear-gradient(135deg, #03170C 0%, #c3ae61 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              până la 5 anunțuri
            </Box>{" "}
            complet gratuit
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ lineHeight: 1.75, fontSize: { xs: "1rem", md: "1.1rem" } }}
          >
            Începi într-un singur minut, fără card de credit și fără angajament. Testezi
            calitatea audienței noastre direct pe rolurile pe care le ai deschise astăzi.
          </Typography>
        </Box>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <Paper
            variant="outlined"
            sx={{
              position: "relative",
              borderRadius: 4,
              overflow: "hidden",
              borderColor: "rgba(195,174,97,0.35)",
              p: { xs: 4, md: 6 },
              background:
                "linear-gradient(135deg, rgba(195,174,97,0.05) 0%, rgba(62,92,118,0.05) 100%)",
            }}
          >
            {/* Decorative ribbon */}
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                top: 18,
                right: -25,
                transform: "rotate(35deg)",
                bgcolor: "rgba(195,174,97,0.9)",
                color: "#03170C",
                fontSize: "0.7rem",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                px: 5,
                py: 0.5,
              }}
            >
              Gratuit
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1.05fr 1fr" },
                gap: { xs: 4, md: 6 },
                alignItems: "center",
              }}
            >
              {/* Left: pitch */}
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(195,174,97,0.12)",
                      border: "1px solid rgba(195,174,97,0.35)",
                      color: "#a08a3a",
                    }}
                  >
                    <RocketLaunchOutlinedIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 700,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                      }}
                    >
                      Gratuit
                    </Typography>
                    <Typography variant="h5" component="h3" sx={{ color: "text.primary" }}>
                      5 anunțuri
                    </Typography>
                  </Box>
                </Stack>

                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ lineHeight: 1.75, mb: 2.5 }}
                >
                  Publicarea anunțurilor pe {appSettings.name} este gratuită până la 5 roluri
                  active simultan. Suficient pentru a testa platforma pe pozițiile tale cheie
                  înainte de a explora opțiunile premium.
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: "italic" }}>
                  Fără reclame, fără spam, fără perioade limitate. Doar acces complet la audiența
                  juridică pe care o construim zi de zi.
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Button
                    component={Link}
                    href="/anunt"
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      px: 4,
                      py: 1.6,
                      borderRadius: 99,
                      fontWeight: 700,
                      bgcolor: "rgba(195,174,97,0.95)",
                      "&:hover": {
                        bgcolor: "#c3ae61",
                        boxShadow: "0 10px 32px rgba(195,174,97,0.35)",
                        transform: "translateY(-1px)",
                      },
                      transition: "all 0.2s",
                    }}
                  >
                    Postează gratuit
                  </Button>
                  <Button
                    component={Link}
                    href="/register"
                    variant="outlined"
                    size="large"
                    sx={{
                      px: 4,
                      py: 1.6,
                      borderRadius: 99,
                      fontWeight: 600,
                      borderColor: "rgba(3,23,12,0.25)",
                      color: "text.primary",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: "rgba(3,23,12,0.04)",
                      },
                    }}
                  >
                    Creează cont
                  </Button>
                </Stack>
              </Box>

              {/* Right: checklist */}
              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    color: "primary.main",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    display: "block",
                    mb: 2,
                  }}
                >
                  Ce este inclus în planul gratuit?
                </Typography>
                <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
                  {includedFeatures.map((feature) => (
                    <Box
                      component="li"
                      key={feature}
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                        py: 1,
                        borderBottom: "1px solid rgba(3,23,12,0.06)",
                        "&:last-of-type": { borderBottom: "none" },
                      }}
                    >
                      <CheckCircleOutlineIcon
                        sx={{ color: "#2d6a4f", fontSize: 22, mt: "2px", flexShrink: 0 }}
                        aria-hidden
                      />
                      <Typography
                        variant="body2"
                        sx={{ color: "text.primary", lineHeight: 1.65 }}
                      >
                        {feature}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}
