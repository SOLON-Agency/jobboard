"use client";

import React from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { motion, type Variants } from "framer-motion";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GavelIcon from "@mui/icons-material/Gavel";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import appSettings from "@/config/app.settings.json";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const BG = "#03170C";
const GOLD = "rgba(195,174,97,0.9)";
const GOLD_FULL = "rgba(195,174,97,1)";
const CREAM = "#F0EBD8";
const CREAM_55 = "rgba(240,235,216,0.55)";
const CREAM_45 = "rgba(240,235,216,0.45)";
const STEEL = "rgba(62,92,118,0.85)";

// ── Framer variants ───────────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut", delay: i * 0.1 },
  }),
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

// ── Data ──────────────────────────────────────────────────────────────────────
const candidateSteps = [
  {
    number: "01",
    icon: <AccountCircleOutlinedIcon sx={{ fontSize: 26 }} />,
    title: "Creează-ți profilul",
    body: "Înregistrare gratuită în 2 minute. Adaugă experiența, educația și abilitățile pentru a fi remarcat de angajatori.",
    color: STEEL,
    border: "rgba(62,92,118,0.2)",
    bg: "rgba(62,92,118,0.06)",
  },
  {
    number: "02",
    icon: <SearchIcon sx={{ fontSize: 26 }} />,
    title: "Caută și explorează",
    body: "Filtrează după locație, salariu, tip de contract și nivel de experiență. Descoperă firme de avocatură de top.",
    color: "rgba(195,174,97,0.9)",
    border: "rgba(195,174,97,0.2)",
    bg: "rgba(195,174,97,0.06)",
  },
  {
    number: "03",
    icon: <ArticleOutlinedIcon sx={{ fontSize: 26 }} />,
    title: "Aplică direct",
    body: "Trimite candidatura cu un singur click prin formulare personalizate. Urmărești toate aplicațiile din dashboard.",
    color: "rgba(45,106,79,0.9)",
    border: "rgba(45,106,79,0.2)",
    bg: "rgba(45,106,79,0.06)",
  },
  {
    number: "04",
    icon: <NotificationsOutlinedIcon sx={{ fontSize: 26 }} />,
    title: "Configurează alerte",
    body: "Salvează filtrele ca alerte și primești notificări automate când apar poziții noi care corespund criteriilor tale.",
    color: "rgba(116,140,171,0.9)",
    border: "rgba(116,140,171,0.2)",
    bg: "rgba(116,140,171,0.06)",
  },
];

const employerSteps = [
  {
    number: "01",
    icon: <BusinessCenterIcon sx={{ fontSize: 26 }} />,
    title: "Creează pagina companiei",
    body: "Prezintă-ți firma, cultura organizațională și echipa. Un profil complet atrage candidați mai calificați.",
  },
  {
    number: "02",
    icon: <WorkOutlineIcon sx={{ fontSize: 26 }} />,
    title: "Publică anunțuri de angajare",
    body: "Adaugă posturi cu formulare de candidatură personalizate sau cu link extern. Primul anunț este gratuit.",
  },
  {
    number: "03",
    icon: <PeopleOutlineIcon sx={{ fontSize: 26 }} />,
    title: "Gestionează candidaturile",
    body: "Revizuiește aplicațiile din dashboard, contactează candidații și ia decizii mai rapide.",
  },
];

const benefits = [
  {
    icon: <LockOpenOutlinedIcon sx={{ fontSize: 28 }} />,
    title: "100% gratuit pentru candidați",
    body: "Niciun abonament, nicio taxă ascunsă. Explorezi, aplici și îți gestionezi cariera fără costuri.",
    color: "rgba(45,106,79,0.9)",
    border: "rgba(45,106,79,0.15)",
    bg: "rgba(45,106,79,0.06)",
  },
  {
    icon: <GavelIcon sx={{ fontSize: 28 }} />,
    title: "Specializat în domeniul juridic",
    body: "Nu suntem un job board generic. Fiecare funcție a platformei este gândită pentru avocați și profesioniști juridici.",
    color: GOLD,
    border: "rgba(195,174,97,0.2)",
    bg: "rgba(195,174,97,0.06)",
  },
  {
    icon: <SpeedOutlinedIcon sx={{ fontSize: 28 }} />,
    title: "Aplicare rapidă",
    body: "Profilul tău salvat completează automat formularele. Aplici la un post în mai puțin de 60 de secunde.",
    color: STEEL,
    border: "rgba(62,92,118,0.15)",
    bg: "rgba(62,92,118,0.06)",
  },
  {
    icon: <TrendingUpIcon sx={{ fontSize: 28 }} />,
    title: "Oportunități la toate nivelurile",
    body: "De la stagii și internship-uri la roluri senior și parteneriate — o oportunitate pentru fiecare etapă a carierei.",
    color: "rgba(116,140,171,0.9)",
    border: "rgba(116,140,171,0.15)",
    bg: "rgba(116,140,171,0.06)",
  },
];

const faqs = [
  {
    q: "Este platforma gratuită pentru candidați?",
    a: "Da, complet gratuit. Creezi cont, îți completezi profilul și aplici la oricâte posturi dorești fără nicio taxă.",
  },
  {
    q: "Cum funcționează alertele de joburi?",
    a: "Salvezi un set de filtre (locație, tip contract, nivel) și primești un email automat de fiecare dată când apare un post nou care se potrivește.",
  },
  {
    q: "Pot urmări statusul aplicațiilor mele?",
    a: "Da. Din dashboard-ul tău vezi toate candidaturile trimise, data aplicării și statusul fiecăreia.",
  },
  {
    q: "Cum postez un anunț ca angajator?",
    a: "Creezi un cont de companie, completezi profilul firmei și publici primul anunț gratuit. Planurile premium oferă vizibilitate crescută și funcții avansate.",
  },
  {
    q: "Datele mele sunt în siguranță?",
    a: "Folosim criptare end-to-end și nu vindem datele tale unor terți. Respectăm pe deplin GDPR.",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HowItWorksPage() {
  return (
    <Box component="main">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <Box
        component="section"
        sx={{
          bgcolor: BG,
          position: "relative",
          overflow: "hidden",
          py: { xs: 14, md: 18 },
        }}
      >
        {/* Grid texture */}
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
        {/* Glow orbs */}
        <Box aria-hidden sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <Box sx={{
            position: "absolute", top: "-10%", left: "30%",
            width: 700, height: 700, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(195,174,97,0.07) 0%, transparent 65%)",
            filter: "blur(80px)",
          }} />
          <Box sx={{
            position: "absolute", bottom: "-15%", right: "10%",
            width: 500, height: 500, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(62,92,118,0.1) 0%, transparent 65%)",
            filter: "blur(100px)",
          }} />
        </Box>

        <Container maxWidth="md" sx={{ position: "relative", zIndex: 10, textAlign: "center" }}>
          <motion.div variants={stagger} initial="hidden" animate="visible">

            <motion.div variants={fadeUp} custom={0}>
              <Box sx={{
                display: "inline-flex", alignItems: "center", gap: 1,
                mb: 4, px: 2.5, py: 1, borderRadius: 99,
                border: "1px solid rgba(195,174,97,0.3)",
                bgcolor: "rgba(195,174,97,0.08)", backdropFilter: "blur(8px)",
              }}>
                <AutoAwesomeIcon sx={{ fontSize: 15, color: GOLD }} />
                <Typography variant="caption" sx={{
                  color: GOLD, fontWeight: 700, letterSpacing: "0.22em",
                  textTransform: "uppercase", fontSize: "0.68rem",
                }}>
                  Ghid complet
                </Typography>
              </Box>
            </motion.div>

            <motion.div variants={fadeUp} custom={1}>
              <Typography component="h1" sx={{
                fontSize: { xs: "2.4rem", sm: "3.2rem", md: "4rem" },
                fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1,
                color: CREAM, mb: 3,
              }}>
                Cum funcționează{" "}
                <Box component="span" sx={{
                  background: "linear-gradient(135deg, rgba(195,174,97,1) 0%, rgba(116,140,171,0.9) 60%, rgba(240,235,216,0.8) 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>
                  {appSettings.name}
                </Box>
              </Typography>
            </motion.div>

            <motion.div variants={fadeUp} custom={2}>
              <Typography sx={{
                fontSize: { xs: "1.05rem", md: "1.2rem" },
                color: CREAM_55, maxWidth: 560, mx: "auto", mb: 6, lineHeight: 1.75,
              }}>
                De la creare cont la oferta de angajare — patru pași simpli pentru candidați,
                trei pași rapizi pentru angajatori.
              </Typography>
            </motion.div>

            <motion.div variants={fadeUp} custom={3}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                <Button
                  component={Link} href="#candidati" variant="contained" size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    px: 4, py: 1.6, borderRadius: 99, fontWeight: 700,
                    bgcolor: GOLD, color: "white",
                    "&:hover": { bgcolor: GOLD_FULL, transform: "translateY(-1px)", boxShadow: "0 8px 32px rgba(195,174,97,0.35)" },
                    transition: "all 0.2s",
                  }}
                >
                  Sunt candidat
                </Button>
                <Button
                  component={Link} href="#angajatori" variant="outlined" size="large"
                  sx={{
                    px: 4, py: 1.6, borderRadius: 99, fontWeight: 600,
                    borderColor: "rgba(240,235,216,0.25)", color: "rgba(240,235,216,0.8)",
                    backdropFilter: "blur(8px)", bgcolor: "rgba(240,235,216,0.05)",
                    "&:hover": { borderColor: "rgba(240,235,216,0.5)", bgcolor: "rgba(240,235,216,0.1)", transform: "translateY(-1px)" },
                    transition: "all 0.2s",
                  }}
                >
                  Sunt angajator
                </Button>
              </Stack>
            </motion.div>

          </motion.div>
        </Container>
      </Box>

      {/* ── CANDIDATES STEPS ─────────────────────────────────────────────────── */}
      <Box
        id="candidati"
        component="section"
        sx={{ bgcolor: "background.default", py: { xs: 10, md: 14 } }}
      >
        <Container maxWidth="lg">
          <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
            <Box sx={{ textAlign: "center", mb: 8 }}>
              <Typography variant="overline" sx={{
                color: "primary.main", fontWeight: 700,
                letterSpacing: "0.2em", display: "block", mb: 1.5,
              }}>
                Pentru candidați
              </Typography>
              <Typography variant="h2" sx={{ mb: 2 }}>
                Găsește jobul perfect în{" "}
                <Box component="span" sx={{
                  background: "linear-gradient(135deg, #03170C 0%, #3E5C76 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>
                  4 pași
                </Box>
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: "auto" }}>
                Simplu, rapid și complet gratuit. Profilul tău rămâne salvat pentru aplicații viitoare.
              </Typography>
            </Box>
          </motion.div>

          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
            gap: 3,
            position: "relative",
          }}>
            {/* Connector line (desktop only) */}
            <Box aria-hidden sx={{
              display: { xs: "none", lg: "block" },
              position: "absolute",
              top: 52,
              left: "calc(12.5% + 16px)",
              right: "calc(12.5% + 16px)",
              height: 1,
              bgcolor: "divider",
              zIndex: 0,
            }} />

            {candidateSteps.map((step, i) => (
              <motion.div
                key={step.number}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
              >
                <Paper variant="outlined" sx={{
                  p: 3, height: "100%", borderRadius: 3,
                  borderColor: step.border, bgcolor: step.bg,
                  position: "relative", zIndex: 1,
                  transition: "all 0.25s",
                  "&:hover": {
                    borderColor: step.color,
                    transform: "translateY(-4px)",
                    boxShadow: `0 12px 40px ${step.bg}`,
                  },
                }}>
                  {/* Number badge */}
                  <Box sx={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 44, height: 44, borderRadius: "50%",
                    border: `1px solid ${step.border}`,
                    bgcolor: "background.paper",
                    mb: 2.5,
                  }}>
                    <Typography sx={{
                      fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.05em",
                      color: step.color,
                    }}>
                      {step.number}
                    </Typography>
                  </Box>

                  {/* Icon */}
                  <Box sx={{
                    width: 52, height: 52, borderRadius: 2.5,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    bgcolor: step.bg, border: `1px solid ${step.border}`,
                    color: step.color, mb: 2.5,
                  }}>
                    {step.icon}
                  </Box>

                  <Typography variant="h5" sx={{ mb: 1 }}>{step.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {step.body}
                  </Typography>
                </Paper>
              </motion.div>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── EMPLOYERS STEPS ──────────────────────────────────────────────────── */}
      <Box
        id="angajatori"
        component="section"
        sx={{ bgcolor: BG, py: { xs: 10, md: 14 }, position: "relative", overflow: "hidden" }}
      >
        <Box aria-hidden sx={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(195,174,97,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px", pointerEvents: "none",
        }} />
        <Box aria-hidden sx={{
          position: "absolute", top: "-20%", right: "-10%",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(62,92,118,0.1) 0%, transparent 65%)",
          filter: "blur(100px)", pointerEvents: "none",
        }} />

        <Container maxWidth="lg" sx={{ position: "relative" }}>
          <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
            <Box sx={{ textAlign: "center", mb: 8 }}>
              <Typography variant="overline" sx={{
                color: GOLD, fontWeight: 700, letterSpacing: "0.2em",
                display: "block", mb: 1.5,
              }}>
                Pentru angajatori
              </Typography>
              <Typography variant="h2" sx={{ color: CREAM, mb: 2 }}>
                Atrage talentele juridice{" "}
                <Box component="span" sx={{
                  background: "linear-gradient(135deg, rgba(195,174,97,1) 0%, rgba(116,140,171,0.9) 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>
                  potrivite
                </Box>
              </Typography>
              <Typography sx={{ color: CREAM_55, maxWidth: 480, mx: "auto" }}>
                Publică primul anunț gratuit și conectează-te cu cei mai buni profesioniști juridici din România.
              </Typography>
            </Box>
          </motion.div>

          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 4,
          }}>
            {employerSteps.map((step, i) => (
              <motion.div
                key={step.number}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
              >
                <Stack spacing={2}>
                  <Typography sx={{
                    fontSize: "3.5rem", fontWeight: 800, lineHeight: 1,
                    background: "linear-gradient(135deg, rgba(195,174,97,0.9) 0%, rgba(116,140,171,0.6) 100%)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  }}>
                    {step.number}
                  </Typography>
                  <Box sx={{ width: 40, height: 2, bgcolor: "rgba(195,174,97,0.3)", borderRadius: 1 }} />
                  <Box sx={{
                    width: 52, height: 52, borderRadius: 2.5,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    bgcolor: "rgba(195,174,97,0.06)", border: "1px solid rgba(195,174,97,0.18)",
                    color: GOLD,
                  }}>
                    {step.icon}
                  </Box>
                  <Typography variant="h4" sx={{ color: CREAM }}>{step.title}</Typography>
                  <Typography sx={{ color: CREAM_55, lineHeight: 1.75 }}>{step.body}</Typography>
                </Stack>
              </motion.div>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── BENEFITS ─────────────────────────────────────────────────────────── */}
      <Box component="section" sx={{ bgcolor: "background.default", py: { xs: 10, md: 14 } }}>
        <Container maxWidth="lg">
          <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
            <Box sx={{ textAlign: "center", mb: 8 }}>
              <Typography variant="overline" sx={{
                color: "primary.main", fontWeight: 700, letterSpacing: "0.2em",
                display: "block", mb: 1.5,
              }}>
                De ce {appSettings.name}
              </Typography>
              <Typography variant="h2" sx={{ mb: 2 }}>
                Construit special pentru{" "}
                <Box component="span" sx={{
                  background: "linear-gradient(135deg, #03170C 0%, #3E5C76 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>
                  lumea juridică
                </Box>
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520, mx: "auto" }}>
                Nu suntem un job board generic — fiecare funcție este gândită pentru avocați, juriști și firme de avocatură.
              </Typography>
            </Box>
          </motion.div>

          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: 3,
          }}>
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
              >
                <Paper variant="outlined" sx={{
                  p: 3, height: "100%", borderRadius: 3,
                  borderColor: b.border, bgcolor: b.bg,
                  transition: "all 0.25s",
                  "&:hover": {
                    borderColor: b.color,
                    transform: "translateY(-4px)",
                    boxShadow: `0 12px 40px ${b.bg}`,
                  },
                }}>
                  <Box sx={{
                    width: 52, height: 52, borderRadius: 2.5,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    bgcolor: b.bg, border: `1px solid ${b.border}`,
                    color: b.color, mb: 2.5,
                  }}>
                    {b.icon}
                  </Box>
                  <Typography variant="h5" sx={{ mb: 1 }}>{b.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {b.body}
                  </Typography>
                </Paper>
              </motion.div>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <Box component="section" sx={{ bgcolor: BG, py: { xs: 10, md: 14 }, position: "relative", overflow: "hidden" }}>
        <Box aria-hidden sx={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(195,174,97,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px", pointerEvents: "none",
        }} />

        <Container maxWidth="md" sx={{ position: "relative" }}>
          <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
            <Box sx={{ textAlign: "center", mb: 8 }}>
              <Typography variant="overline" sx={{
                color: GOLD, fontWeight: 700, letterSpacing: "0.2em", display: "block", mb: 1.5,
              }}>
                Întrebări frecvente
              </Typography>
              <Typography variant="h2" sx={{ color: CREAM, mb: 2 }}>
                Ai întrebări?
              </Typography>
              <Typography sx={{ color: CREAM_55, maxWidth: 400, mx: "auto" }}>
                Răspunsuri la cele mai comune nelămuriri despre platformă.
              </Typography>
            </Box>
          </motion.div>

          <Stack spacing={1.5}>
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.q}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
              >
                <Accordion sx={{
                  bgcolor: "rgba(240,235,216,0.04)",
                  border: "1px solid rgba(240,235,216,0.1)",
                  borderRadius: "12px !important",
                  "&:before": { display: "none" },
                  "&.Mui-expanded": {
                    border: "1px solid rgba(195,174,97,0.25)",
                    bgcolor: "rgba(195,174,97,0.04)",
                  },
                  backdropFilter: "blur(8px)",
                }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: CREAM_45 }} />}
                    sx={{ px: 3, py: 0.5 }}
                  >
                    <Typography sx={{ color: CREAM, fontWeight: 600, fontSize: "0.97rem" }}>
                      {faq.q}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 3, pb: 2.5 }}>
                    <Typography sx={{ color: CREAM_55, lineHeight: 1.75 }}>{faq.a}</Typography>
                  </AccordionDetails>
                </Accordion>
              </motion.div>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <Box component="section" sx={{ bgcolor: BG, pb: { xs: 10, md: 14 } }}>
        <Container maxWidth="lg">
          <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Box sx={{
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
            }}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 18, color: GOLD }} />
                  <Typography variant="caption" sx={{
                    color: GOLD, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
                  }}>
                    Înregistrare gratuită
                  </Typography>
                </Stack>
                <Typography variant="h3" sx={{ color: CREAM, mb: 0.5 }}>
                  Gata să faci primul pas?
                </Typography>
                <Typography sx={{ color: CREAM_55 }}>
                  Alătură-te celor peste 900 de profesioniști juridici activi pe platformă.
                </Typography>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ flexShrink: 0 }}>
                <Button
                  component={Link}
                  href="/register"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    px: 4, py: 1.5, borderRadius: 99, fontWeight: 700,
                    bgcolor: GOLD, color: "white",
                    "&:hover": { bgcolor: GOLD_FULL, boxShadow: "0 6px 24px rgba(195,174,97,0.3)" },
                  }}
                >
                  Creează cont gratuit
                </Button>
                <Button
                  component={Link}
                  href="/jobs"
                  variant="outlined"
                  size="large"
                  sx={{
                    px: 4, py: 1.5, borderRadius: 99, fontWeight: 600,
                    borderColor: "rgba(240,235,216,0.2)", color: "rgba(240,235,216,0.7)",
                    "&:hover": { borderColor: "rgba(240,235,216,0.4)", bgcolor: "rgba(240,235,216,0.05)" },
                  }}
                >
                  Explorează posturi
                </Button>
              </Stack>
            </Box>
          </motion.div>
        </Container>
      </Box>

    </Box>
  );
}
