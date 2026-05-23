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
    title: "Numai potriviri relevante, fără zgomot inutil",
    description:
      "Experiența, specializarea și cerințele fiecărui rol sunt analizate automat. Profesioniștii juridici descoperă oportunități aliniate profilului lor, iar angajatorii primesc aplicații mai bine calibrate, cu mai puțin timp pierdut de ambele părți.",
    bullets: [
      "Recomandări bazate pe practică, vechime și jurisdicție",
      "Formulare de aplicare clare și adaptate fiecărui anunț",
      "Triere mai eficientă pentru recrutori și candidați",
    ],
    color: "#c3ae61",
    lightBg: "rgba(195,174,97,0.06)",
    border: "rgba(195,174,97,0.2)",
  },
  {
    icon: <NotificationsActiveOutlinedIcon sx={{ fontSize: 30 }} />,
    badge: "Alerte personalizate",
    title: "Notificări email și SMS, la momentul potrivit",
    description:
      "Salvează căutările și criteriile preferate, iar platforma trimite alerte când apar anunțuri sau oportunități relevante - de la posturi de avocat definitiv și stagiar, până la roluri de jurist sau consilier juridic in-house.",
    bullets: [
      "Notificări în timp real pe e-mail și în browser",
      "Filtre pe specializare, locație și nivel de experiență",
      "Reacție rapidă la anunțuri noi, înainte să se umple pipeline-ul",
      "Alertele pot fi activate sau oprite oricând din panoul de control",
    ],
    color: "#3E5C76",
    lightBg: "rgba(62,92,118,0.06)",
    border: "rgba(62,92,118,0.18)",
  },
  {
    icon: <PaymentsOutlinedIcon sx={{ fontSize: 30 }} />,
    badge: "Transparență salarială",
    title: "Salarii și beneficii vizibile pentru fiecare anunț",
    description:
      "Intervalele salariale și pachetele de beneficii sunt afișate direct în anunțuri. Candidații evaluează rapid dacă rolul se potrivește, iar angajatorii atrag persoane cu așteptări realiste și interes real.",
    bullets: [
      "Interval salarial brut afișat în RON pe fiecare anunț",
      "Beneficii și bonusuri descrise explicit",
      "Așteptări aliniate între candidați și angajatori",
    ],
    color: "#2d6a4f",
    lightBg: "rgba(45,106,79,0.06)",
    border: "rgba(45,106,79,0.18)",
  },
  {
    icon: <BusinessOutlinedIcon sx={{ fontSize: 30 }} />,
    badge: "Portal societate juridică",
    title: "Profil complet pentru societățile juridice relevante",
    description:
      "Fiecare companie are o pagină dedicată: identitate vizuală, domenii de practică și toate pozițiile active într-un singur loc. Angajatorii își consolidează brandul juridic, iar profesioniștii juridici pot evalua oferta generală înainte de a aplica.",
    bullets: [
      "Profile dedicate pentru firme din piața juridică românească",
      "Context despre specializări, cultură de lucru și tipul mandatelor",
    ],
    color: "#415a77",
    lightBg: "rgba(65,90,119,0.07)",
    border: "rgba(65,90,119,0.22)",
  },
  {
    icon: <VerifiedOutlinedIcon sx={{ fontSize: 30 }} />,
    badge: "Candidați verificați",
    title: "O comunitate profesională, nu trafic anonim",
    description:
      "Profilurile includ experiență, formare juridică și competențe verificate. Candidații își prezintă parcursul cu claritate, iar recrutorii evaluează aplicațiile prin răspunsurile candidaților la întrebări uniforme - un standard comun care ridică calitatea întregului proces.",
    bullets: [
      "Profil structurat cu experiență, educație și competențe",
      "Aplicații mai relevante pentru echipele de recrutare",
      "Vizibilitate echitabilă pentru profesioniștii activi pe platformă",
    ],
    color: "#748CAB",
    lightBg: "rgba(116,140,171,0.08)",
    border: "rgba(116,140,171,0.2)",
  },
  {
    icon: <GppGoodOutlinedIcon sx={{ fontSize: 30 }} />,
    badge: "Securitate & GDPR",
    title: "Protecția datelor, la standarde europene",
    description:
      "Informațiile sensibile sunt procesate strict în scopul recrutării, cu drepturi clare de acces, rectificare și ștergere. Fiecare utilizator controlează ce date partajează, cu cine le partajează și în ce condiții. Datele nu sunt vândute către terți.",
    bullets: [
      "Stocare securizată în infrastructură conformă cu GDPR",
      "Control asupra vizibilității profilului și a notificărilor",
      "Politici transparente de retenție și ștergere a datelor",
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
              Câteva avantaje care diferențiază {appSettings.name} de platformele generaliste de
            recrutare.
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

                {/* <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
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
                </Box> */}
              </Paper>
            </motion.div>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
