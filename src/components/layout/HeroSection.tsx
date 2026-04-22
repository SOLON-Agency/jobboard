"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { heroContainer, heroItem, statsContainer } from "@/lib/motion";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import GavelIcon from "@mui/icons-material/Gavel";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";

// ── Brand colors (from palette.ts) ───────────────────────────────────────────

const BG = "#03170C";
const WAVES = [
  { offset: 0,              amplitude: 70, frequency: 0.003,  color: "rgba(195,174,97,0.9)",  opacity: 0.55 },
  { offset: Math.PI / 2,   amplitude: 90, frequency: 0.0026, color: "rgba(62,92,118,0.85)",   opacity: 0.45 },
  { offset: Math.PI,       amplitude: 60, frequency: 0.0034, color: "rgba(116,140,171,0.8)",  opacity: 0.40 },
  { offset: Math.PI * 1.5, amplitude: 80, frequency: 0.0022, color: "rgba(15,64,36,0.9)",     opacity: 0.35 },
  { offset: Math.PI * 2,   amplitude: 55, frequency: 0.004,  color: "rgba(240,235,216,0.5)",  opacity: 0.25 },
];

// ── Stats helpers ─────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1000) return `${(Math.floor(n / 100) / 10).toLocaleString("ro")}K+`;
  if (n >= 100)  return `${Math.floor(n / 100) * 100}+`;
  if (n >= 50)   return `${Math.floor(n / 50) * 50}+`;
  if (n >= 30)   return `${Math.floor(n / 30) * 30}+`;
  if (n >= 20)   return `${Math.floor(n / 20) * 20}+`;
  if (n >= 10)   return `${Math.floor(n / 10) * 10}+`;
  return `${n}`;
}

export interface HeroCounts {
  jobs: number;
  companies: number;
  users: number;
}

// ── Pills ─────────────────────────────────────────────────────────────────────

const pills = ["Acces gratuit", "Aplicare rapidă", "Alerte inteligente"] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function HeroSection({ counts }: { counts?: HeroCounts }) {
  const stats = [
    { icon: <BusinessCenterIcon sx={{ fontSize: 20, color: "rgba(195,174,97,0.9)" }} />, label: "Anunțuri", value: counts ? formatCount(counts.jobs) : "100+" },
    { icon: <GavelIcon sx={{ fontSize: 20, color: "rgba(116,140,171,0.9)" }} />, label: "Firme", value: counts ? formatCount(counts.companies) : "10+" },
    { icon: <PeopleOutlineIcon sx={{ fontSize: 20, color: "rgba(240,235,216,0.8)" }} />, label: "Candidați", value: counts ? formatCount(counts.users) : "900+" },
  ];
  console.log(counts);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });

  // ── Canvas animation ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouseInfluence = prefersReduced ? 10 : 60;
    const influenceRadius = prefersReduced ? 160 : 300;
    const smoothing = prefersReduced ? 0.04 : 0.1;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const cx = { x: canvas.width / 2, y: canvas.height / 2 };
      mouseRef.current = { ...cx };
      targetRef.current = { ...cx };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onMouseLeave = () => {
      targetRef.current = { x: canvas.width / 2, y: canvas.height / 2 };
    };

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    const drawWave = (wave: typeof WAVES[number]) => {
      ctx.save();
      ctx.beginPath();

      for (let x = 0; x <= canvas.width; x += 4) {
        const dx = x - mouseRef.current.x;
        const dy = canvas.height / 2 - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - dist / influenceRadius);
        const mouseEffect = influence * mouseInfluence * Math.sin(time * 0.001 + x * 0.01 + wave.offset);

        const y =
          canvas.height / 2 +
          Math.sin(x * wave.frequency + time * 0.002 + wave.offset) * wave.amplitude +
          Math.sin(x * wave.frequency * 0.4 + time * 0.003) * (wave.amplitude * 0.45) +
          mouseEffect;

        if (x === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
      }

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = wave.color;
      ctx.globalAlpha = wave.opacity;
      ctx.shadowBlur = 40;
      ctx.shadowColor = wave.color;
      ctx.stroke();
      ctx.restore();
    };

    const animate = () => {
      time++;
      mouseRef.current.x += (targetRef.current.x - mouseRef.current.x) * smoothing;
      mouseRef.current.y += (targetRef.current.y - mouseRef.current.y) * smoothing;

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      WAVES.forEach(drawWave);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        bgcolor: BG,
      }}
    >
      {/* Canvas background */}
      <Box
        component="canvas"
        ref={canvasRef}
        aria-hidden="true"
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />

      {/* Radial glow overlays */}
      <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Box sx={{
          position: "absolute", top: 0, left: "50%",
          transform: "translateX(-50%)",
          width: 600, height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(195,174,97,0.06) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />
        <Box sx={{
          position: "absolute", bottom: 0, right: 0,
          width: 400, height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(62,92,118,0.08) 0%, transparent 70%)",
          filter: "blur(80px)",
        }} />
      </Box>

      {/* Content */}
      <Container
        maxWidth="lg"
        sx={{ position: "relative", zIndex: 10, pb: { xs: 4, md: 8 }, pt: { xs: 4, md: 0 }, textAlign: "center" }}
      >
        <motion.div variants={heroContainer} initial="hidden" animate="visible">

          {/* Badge */}
          <motion.div variants={heroItem}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                mb: 4,
                px: 2.5,
                py: 1,
                borderRadius: 99,
                border: "1px solid rgba(195,174,97,0.3)",
                bgcolor: "rgba(195,174,97,0.08)",
                backdropFilter: "blur(8px)",
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 15, color: "rgba(195,174,97,0.9)" }} />
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(195,174,97,0.85)",
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  fontSize: "0.68rem",
                }}
              >
                Platforma #1 pentru recrutat avocați
              </Typography>
            </Box>
          </motion.div>

          {/* Heading */}
          <motion.div variants={heroItem}>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: "2.4rem", sm: "3.2rem", md: "4.5rem", lg: "5rem" },
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                color: "#F0EBD8",
                mb: 3,
              }}
            >
              Cariera ta{" "}
              <Box
                component="span"
                sx={{
                  background: "linear-gradient(135deg, rgba(195,174,97,1) 0%, rgba(116,140,171,0.9) 60%, rgba(240,235,216,0.8) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                juridică
              </Box>
              {" "}începe aici
            </Typography>
          </motion.div>

          {/* Subtitle */}
          {/* <motion.div variants={heroItem}>
            <Typography
              sx={{
                fontSize: { xs: "1.05rem", md: "1.35rem" },
                color: "rgba(240,235,216,0.65)",
                maxWidth: 640,
                mx: "auto",
                mb: 5,
                lineHeight: 1.7,
              }}
            >
              Explorează sute de posturi la firme de top de avocatură
              și aplică direct pentru pozițiile care te interesează.
            </Typography>
          </motion.div> */}

          {/* CTAs */}
          <motion.div variants={heroItem}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
              sx={{ mb: 5 }}
            >
              <Button
                component={Link}
                href="/jobs"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon sx={{ transition: "transform 0.2s", ".MuiButton-root:hover &": { transform: "translateX(4px)" } }} />}
                sx={{
                  px: 4,
                  py: 1.6,
                  borderRadius: 99,
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  letterSpacing: "0.04em",
                  bgcolor: "rgba(195,174,97,0.9)",
                  color: "white",
                  "&:hover": { bgcolor: "rgba(195,174,97,1)", transform: "translateY(-1px)", boxShadow: "0 8px 32px rgba(195,174,97,0.35)" },
                  transition: "all 0.2s",
                }}
              >
                Explorează anunțuri
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
                  fontSize: "0.95rem",
                  borderColor: "rgba(240,235,216,0.25)",
                  color: "rgba(240,235,216,0.8)",
                  backdropFilter: "blur(8px)",
                  bgcolor: "rgba(240,235,216,0.05)",
                  "&:hover": {
                    borderColor: "rgba(240,235,216,0.5)",
                    bgcolor: "rgba(240,235,216,0.1)",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s",
                }}
              >
                Creează cont gratuit
              </Button>
            </Stack>
          </motion.div>

          {/* Feature pills */}
          <motion.div variants={heroItem}>
            <Stack
              direction="row"
              spacing={1.5}
              justifyContent="center"
              flexWrap="wrap"
              sx={{ mb: 8, gap: 1.5 }}
            >
              {pills.map((pill) => (
                <Box
                  key={pill}
                  sx={{
                    px: 2.5,
                    py: 0.75,
                    borderRadius: 99,
                    border: "1px solid rgba(240,235,216,0.15)",
                    bgcolor: "rgba(240,235,216,0.05)",
                    backdropFilter: "blur(6px)",
                    color: "rgba(240,235,216,0.6)",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  {pill}
                </Box>
              ))}
            </Stack>
          </motion.div>

          {/* Stats bar */}
          <motion.div variants={statsContainer}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                gap: { xs: 2, sm: 0 },
                borderRadius: 3,
                border: "1px solid rgba(240,235,216,0.1)",
                bgcolor: "rgba(240,235,216,0.04)",
                backdropFilter: "blur(12px)",
                overflow: "hidden",
                maxWidth: 640,
                mx: "auto",
              }}
            >
              {stats.map((stat, i) => (
                <motion.div key={stat.label} variants={heroItem}>
                  <Box
                    sx={{
                      px: 3,
                      py: 3,
                      textAlign: "center",
                      borderRight: { sm: i < stats.length - 1 ? "1px solid rgba(240,235,216,0.08)" : "none" },
                    }}
                  >
                    <Box sx={{ mb: 0.75, display: "flex", justifyContent: "center" }}>
                      {stat.icon}
                    </Box>
                    <Typography
                      sx={{
                        fontSize: "1.85rem",
                        fontWeight: 800,
                        color: "#F0EBD8",
                        lineHeight: 1,
                        mb: 0.5,
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.68rem",
                        fontWeight: 600,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        color: "rgba(240,235,216,0.45)",
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                </motion.div>
              ))}
            </Box>
          </motion.div>

        </motion.div>
      </Container>
    </Box>
  );
};
