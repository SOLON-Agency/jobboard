"use client";

import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import BalanceOutlinedIcon from "@mui/icons-material/BalanceOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import appSettings from "@/config/app.settings.json";

interface AudienceCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  outcome: string;
}

const audiences: readonly AudienceCard[] = [
  {
    icon: <AccountBalanceOutlinedIcon sx={{ fontSize: 30 }} />,
    title: "Cabinete și societăți de avocatură",
    description:
      "De la cabinete individuale la SCA-uri și SCPA-uri de top, publici anunțuri într-un ecosistem dedicat exclusiv pieței juridice românești.",
    outcome: "Recrutezi mai rapid, fără să te pierzi în portaluri generaliste.",
  },
  {
    icon: <ApartmentOutlinedIcon sx={{ fontSize: 30 }} />,
    title: "Departamente juridice in-house",
    description:
      "Companiile naționale și multinaționale își construiesc echipele juridice interne cu acces la candidați care înțeleg contextul de business.",
    outcome: "Atragi juriști pregătiți pentru un rol corporativ exigent.",
  },
  {
    icon: <GavelOutlinedIcon sx={{ fontSize: 30 }} />,
    title: "Avocați definitivi",
    description:
      "Profesioniștii cu experiență își prezintă cu eleganță parcursul, specializările și obiectivele de carieră — și descoperă oportunități pe măsura ambițiilor lor.",
    outcome: "Aplici doar la roluri aliniate cu seniorul tău profesional.",
  },
  {
    icon: <SchoolOutlinedIcon sx={{ fontSize: 30 }} />,
    title: "Avocați stagiari & juniori",
    description:
      "Începutul de carieră contează enorm. Pe platformă găsești programe de internship, stagiatură și poziții entry-level la firme care investesc în noua generație juridică.",
    outcome: "Pornești cariera de la o firmă care îți este într-adevăr potrivită.",
  },
  {
    icon: <BalanceOutlinedIcon sx={{ fontSize: 30 }} />,
    title: "Consilieri juridici & juriști",
    description:
      "Pentru juriștii din instituții publice, ONG-uri sau companii private, publicăm roluri cu domenii clare de practică, de la GDPR la dreptul muncii și compliance.",
    outcome: "Îți alegi următoarea misiune cu informații transparente și complete.",
  },
  {
    icon: <GroupsOutlinedIcon sx={{ fontSize: 30 }} />,
    title: "Recrutori și agenții de profil",
    description:
      "Echipele de recrutare specializate au la dispoziție o audiență calificată, dashboard-uri dedicate și fluxuri optimizate pentru selecție rapidă.",
    outcome: "Livrezi clienților potriviri de calitate într-un timp scurt.",
  },
] as const;

export function AudienceSection() {
  return (
    <Box
      component="section"
      aria-labelledby="audience-section-heading"
      sx={{
        position: "relative",
        py: { xs: 10, md: 14 },
        bgcolor: "#03170C",
        color: "#F0EBD8",
        overflow: "hidden",
      }}
    >
      {/* Decorative dotted grid */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(195,174,97,0.05) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }}
      />
      {/* Soft golden glow */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 720,
          height: 480,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(195,174,97,0.07) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative" }}>
        <Box sx={{ textAlign: "center", mb: { xs: 6, md: 8 }, maxWidth: 760, mx: "auto" }}>
          <Typography
            variant="overline"
            sx={{
              color: "rgba(195,174,97,0.85)",
              fontWeight: 700,
              letterSpacing: "0.2em",
              display: "block",
              mb: 1.5,
            }}
          >
            Pentru cine este {appSettings.name}
          </Typography>
          <Typography
            id="audience-section-heading"
            variant="h2"
            component="h2"
            sx={{
              color: "#F0EBD8",
              mb: 2,
              fontSize: { xs: "1.85rem", sm: "2.2rem", md: "2.6rem", lg: "3rem" },
            }}
          >
            Locul unde profesioniștii juridici potriviți{" "}
            <Box
              component="span"
              sx={{
                background:
                  "linear-gradient(135deg, rgba(195,174,97,1) 0%, rgba(116,140,171,0.9) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              se întâlnesc
            </Box>
          </Typography>
          <Typography
            sx={{
              color: "rgba(240,235,216,0.7)",
              lineHeight: 1.75,
              fontSize: { xs: "1rem", md: "1.1rem" },
            }}
          >
            De la firme de avocatură consacrate până la juniori în primul lor an de
            practică, fiecare segment al pieței juridice din România are aici un spațiu
            construit pe măsură.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: { xs: 3, md: 3.5 },
          }}
        >
          {audiences.map((aud, i) => (
            <motion.div
              key={aud.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 3, md: 3.5 },
                  height: "100%",
                  borderRadius: 3,
                  borderColor: "rgba(240,235,216,0.12)",
                  bgcolor: "rgba(240,235,216,0.04)",
                  backdropFilter: "blur(10px)",
                  transition: "all 0.25s",
                  "&:hover": {
                    borderColor: "rgba(195,174,97,0.45)",
                    bgcolor: "rgba(240,235,216,0.06)",
                    transform: "translateY(-4px)",
                    boxShadow: "0 12px 36px rgba(0,0,0,0.25)",
                  },
                }}
              >
                <Stack spacing={2.25}>
                  <Box
                    sx={{
                      width: 54,
                      height: 54,
                      borderRadius: 2.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(195,174,97,0.08)",
                      border: "1px solid rgba(195,174,97,0.25)",
                      color: "rgba(195,174,97,0.95)",
                    }}
                  >
                    {aud.icon}
                  </Box>
                  <Typography
                    variant="h5"
                    component="h3"
                    sx={{
                      color: "#F0EBD8",
                      fontSize: { xs: "1.15rem", md: "1.25rem" },
                    }}
                  >
                    {aud.title}
                  </Typography>
                  <Typography
                    sx={{
                      color: "rgba(240,235,216,0.7)",
                      lineHeight: 1.75,
                      fontSize: "0.95rem",
                    }}
                  >
                    {aud.description}
                  </Typography>
                  {/* <Box
                    sx={{
                      pt: 2,
                      borderTop: "1px solid rgba(240,235,216,0.1)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "rgba(195,174,97,0.85)",
                        fontWeight: 700,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        fontSize: "0.65rem",
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      Beneficiu cheie
                    </Typography>
                    <Typography
                      sx={{
                        color: "rgba(240,235,216,0.85)",
                        fontWeight: 500,
                        lineHeight: 1.6,
                        fontSize: "0.95rem",
                      }}
                    >
                      {aud.outcome}
                    </Typography>
                  </Box> */}
                </Stack>
              </Paper>
            </motion.div>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
