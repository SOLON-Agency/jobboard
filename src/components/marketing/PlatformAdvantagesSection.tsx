"use client";

import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import GppGoodOutlinedIcon from "@mui/icons-material/GppGoodOutlined";
import appSettings from "@/config/app.settings.json";

interface Advantage {
  icon: React.ReactNode;
  badge: string;
  title: string;
  description: string;
  bullets: readonly string[];
  color: string;
  lightBg: string;
  border: string;
}

const advantages: readonly Advantage[] = [
  {
    icon: <AutoAwesomeIcon sx={{ fontSize: 30 }} />,
    badge: "Matchmaking inteligent",
    title: "Matchmaking inteligent automat pentru oportunități juridice",
    description:
      "Algoritmii noștri analizează experiența, specializarea și aspirațiile fiecărui profesionist juridic și le confruntă cu cerințele reale ale fiecărui anunț. Rezultatul: mai puțin zgomot, mai multe potriviri relevante.",
    bullets: [
      "Recomandări calibrate pe practică, vechime și jurisdicție",
      "Formulare personalizate și transparente pentru aplicații",
      "Reducere semnificativă a timpului petrecut cu trierea CV-urilor",
    ],
    color: "#c3ae61",
    lightBg: "rgba(195,174,97,0.06)",
    border: "rgba(195,174,97,0.2)",
  },
  {
    icon: <NotificationsActiveOutlinedIcon sx={{ fontSize: 30 }} />,
    badge: "Alerte personalizate",
    title: "Alerte care lucrează 24/7 pentru cariera ta",
    description:
      "Salvează căutările și competențele tale, iar platforma îți trimite notificări în timp real când apar oportunități relevante: posturi de avocat definitiv, stagiar, jurist sau in-house counsel.",
    bullets: [
      "Notificări în timp real pe SMS, e-mail și în browser",
      "Filtre fine pe specializare, locație și nivel de experiență",
      "Posibilitatea de a aplica înainte ca anunțul să devină viral",
      "Pune alertele pe pauză în orice moment din panoul de control",
    ],
    color: "#3E5C76",
    lightBg: "rgba(62,92,118,0.06)",
    border: "rgba(62,92,118,0.18)",
  },
  {
    icon: <PaymentsOutlinedIcon sx={{ fontSize: 30 }} />,
    badge: "Transparență salarială",
    title: "Salarii afișate clar, fără ghicitori",
    description:
      "Încurajăm angajatorii să publice intervale salariale reale și pachete de beneficii detaliate. Tu vezi din primul minut dacă oportunitatea se aliniază așteptărilor tale profesionale.",
    bullets: [
      "Interval salarial brut afișat în RON pe fiecare anunț",
      "Beneficii și bonusuri descrise explicit",
      "Conversații mai sincere între candidați și angajatori",
    ],
    color: "#2d6a4f",
    lightBg: "rgba(45,106,79,0.06)",
    border: "rgba(45,106,79,0.18)",
  },
  {
    icon: <BusinessOutlinedIcon sx={{ fontSize: 30 }} />,
    badge: "Profile companii",
    title: "Cele mai relevante firme juridice din România",
    description:
      "Fiecărei companii îi dedicăm o pagină completă în ecosistem: identitate vizuală, domenii de practică, cultură de firmă și toate pozițiile active într-un singur loc — ca să alegi angajatori care sunt pe măsura reputației tale profesionale.",
    bullets: [
      "Firme consolidate din piața juridică românească, prezentate transparent pe profile dedicate",
      "Înțelegi în avans cultura de lucru, specializările firmei și natura mandatelor, înainte să aplici"
    ],
    color: "#415a77",
    lightBg: "rgba(65,90,119,0.07)",
    border: "rgba(65,90,119,0.22)",
  },
  {
    icon: <VerifiedOutlinedIcon sx={{ fontSize: 30 }} />,
    badge: "Candidați verificați",
    title: "O comunitate profesională, nu un trafic anonim",
    description:
      "Profilurile candidaților sunt completate cu experiența reală, formarea juridică și competențele probate. Recrutorii primesc aplicații serioase, candidații primesc atenție pe măsură.",
    bullets: [
      "Profil structurat cu experiență, educație și competențe",
      "Standard ridicat de calitate pentru aplicații",
      "Mai puține CV-uri irelevante pentru echipele de recrutare",
    ],
    color: "#748CAB",
    lightBg: "rgba(116,140,171,0.08)",
    border: "rgba(116,140,171,0.2)",
  },
  {
    icon: <GppGoodOutlinedIcon sx={{ fontSize: 30 }} />,
    badge: "Conformitate GDPR",
    title: "Conformitate GDPR la standard european",
    description:
      "Datele sensibile ale profesioniștilor juridici merită tratate ca atare. Procesăm informațiile strict pentru scopurile recrutării, cu drepturi clare de acces, rectificare și ștergere.",
    bullets: [
      "Stocare securizată în infrastructură conformă cu GDPR",
      "Control complet al candidatului asupra vizibilității profilului",
      "Politici clare de retenție și ștergere a datelor",
    ],
    color: "#03170C",
    lightBg: "rgba(3,23,12,0.04)",
    border: "rgba(3,23,12,0.12)",
  },
] as const;

export function PlatformAdvantagesSection() {
  return (
    <Box
      component="section"
      aria-labelledby="platform-advantages-heading"
      sx={{ bgcolor: "background.default", py: { xs: 10, md: 14 } }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: { xs: 6, md: 8 }, maxWidth: 760, mx: "auto" }}>
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
            Avantajele platformei {appSettings.name}
          </Typography>
          <Typography
            id="platform-advantages-heading"
            variant="h2"
            component="h2"
            sx={{ mb: 2, fontSize: { xs: "1.85rem", sm: "2.2rem", md: "2.6rem", lg: "3rem" } }}
          >
            Construit pentru excelență în{" "}
            <Box
              component="span"
              sx={{
                background: "linear-gradient(135deg, #03170C 0%, #c3ae61 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              recrutarea juridică
            </Box>
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ lineHeight: 1.75, fontSize: { xs: "1rem", md: "1.1rem" } }}
          >
            Cinci avantaje care diferențiază {appSettings.name} de platformele generaliste de
            recrutare și care transformă fiecare interacțiune într-un pas concret spre o
            potrivire profesională relevantă.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: { xs: 3, md: 3.5 },
          }}
        >
          {advantages.map((adv, i) => (
            <motion.div
              key={adv.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 3, md: 4 },
                  height: "100%",
                  borderRadius: 3,
                  borderColor: adv.border,
                  bgcolor: adv.lightBg,
                  transition: "all 0.25s",
                  "&:hover": {
                    borderColor: adv.color,
                    transform: "translateY(-4px)",
                    boxShadow: `0 14px 44px ${adv.lightBg}`,
                  },
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 54,
                      height: 54,
                      borderRadius: 2.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: adv.lightBg,
                      border: `1px solid ${adv.border}`,
                      color: adv.color,
                      flexShrink: 0,
                    }}
                  >
                    {adv.icon}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: adv.color,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      fontSize: "0.68rem",
                    }}
                  >
                    {adv.badge}
                  </Typography>
                </Stack>

                <Typography
                  variant="h5"
                  component="h3"
                  sx={{ mb: 1.25, color: "text.primary", fontSize: { xs: "1.15rem", md: "1.25rem" } }}
                >
                  {adv.title}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.75, mb: 2 }}
                >
                  {adv.description}
                </Typography>

                <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
                  {adv.bullets.map((bullet) => (
                    <Box
                      component="li"
                      key={bullet}
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.25,
                        py: 0.5,
                      }}
                    >
                      <Box
                        aria-hidden
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: adv.color,
                          mt: "9px",
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", lineHeight: 1.65 }}
                      >
                        {bullet}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </motion.div>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
