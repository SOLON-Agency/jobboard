"use client";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import type { FaqPublicItem } from "@/services/faq.service";

const BG = "#03170C";
const GOLD = "rgba(195,174,97,0.9)";
const CREAM = "#F0EBD8";
const CREAM_55 = "rgba(240,235,216,0.55)";
const CREAM_45 = "rgba(240,235,216,0.45)";

export interface FaqSectionProps {
  items: FaqPublicItem[];
  variant?: "default" | "dark";
}

export function FaqSection({ items, variant = "default" }: FaqSectionProps) {
  if (items.length === 0) return null;

  const isDark = variant === "dark";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const header = isDark ? (
    <motion.div
      variants={fadeUp}
      custom={0}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      <Box sx={{ textAlign: "center", mb: 8 }}>
        <Typography
          variant="overline"
          sx={{
            color: GOLD,
            fontWeight: 700,
            letterSpacing: "0.2em",
            display: "block",
            mb: 1.5,
          }}
        >
          Întrebări frecvente
        </Typography>
        <Typography id="faq-section-heading" variant="h2" sx={{ color: CREAM, mb: 2 }}>
          Ai întrebări?
        </Typography>
        <Typography sx={{ color: CREAM_55, maxWidth: 400, mx: "auto" }}>
          Răspunsuri la cele mai comune nelămuriri.
        </Typography>
      </Box>
    </motion.div>
  ) : (
    <Box sx={{ textAlign: "center", mb: { xs: 5, md: 7 }, maxWidth: 700, mx: "auto" }}>
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
        Întrebări frecvente
      </Typography>
      <Typography
        id="faq-section-heading"
        variant="h2"
        component="h2"
        sx={{ mb: 2, fontSize: { xs: "1.85rem", sm: "2.2rem", md: "2.6rem" } }}
      >
        Răspunsuri despre{" "}
        <Box
          component="span"
          sx={{
            background: "linear-gradient(135deg, #03170C 0%, #c3ae61 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          recrutare juridică
        </Box>
      </Typography>
    </Box>
  );

  const accordionList = isDark ? (
    <Stack spacing={1.5}>
      {items.map((faq, idx) => (
        <motion.div
          key={`${faq.question}-${idx}`}
          custom={idx}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          <Accordion
            sx={{
              bgcolor: "rgba(240,235,216,0.04)",
              border: "1px solid rgba(240,235,216,0.1)",
              borderRadius: "12px !important",
              "&:before": { display: "none" },
              "&.Mui-expanded": {
                border: "1px solid rgba(195,174,97,0.25)",
                bgcolor: "rgba(195,174,97,0.04)",
              },
              backdropFilter: "blur(8px)",
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: CREAM_45 }} />}
              aria-controls={`faq-content-${idx}`}
              id={`faq-header-${idx}`}
              sx={{ px: 3, py: 0.5 }}
            >
              <Typography
                component="h3"
                sx={{ color: CREAM, fontWeight: 600, fontSize: "0.97rem" }}
              >
                {faq.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, pb: 2.5 }}>
              <Typography sx={{ color: CREAM_55, lineHeight: 1.75 }}>{faq.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        </motion.div>
      ))}
    </Stack>
  ) : (
    <Box>
      {items.map((faq, idx) => (
        <Accordion
          key={`${faq.question}-${idx}`}
          disableGutters
          elevation={0}
          sx={{
            bgcolor: "transparent",
            borderRadius: 2,
            border: "1px solid rgba(3,23,12,0.08)",
            mb: 1.5,
            "&:before": { display: "none" },
            "&:hover": { borderColor: "rgba(195,174,97,0.4)" },
            "&.Mui-expanded": {
              borderColor: "rgba(195,174,97,0.55)",
              bgcolor: "rgba(195,174,97,0.03)",
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: "primary.main" }} />}
            aria-controls={`faq-content-${idx}`}
            id={`faq-header-${idx}`}
            sx={{
              px: { xs: 2.5, md: 3 },
              py: 1.5,
              minHeight: 56,
              "& .MuiAccordionSummary-content": { my: 1.5 },
            }}
          >
            <Typography
              component="h3"
              sx={{
                color: "text.primary",
                fontWeight: 600,
                fontSize: { xs: "1rem", md: "1.05rem" },
                lineHeight: 1.5,
              }}
            >
              {faq.question}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: { xs: 2.5, md: 3 }, pb: 3, pt: 0 }}>
            <Typography
              sx={{
                color: "text.secondary",
                lineHeight: 1.8,
                fontSize: { xs: "0.95rem", md: "1rem" },
              }}
            >
              {faq.answer}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );

  return (
    <Box
      component="section"
      aria-labelledby="faq-section-heading"
      sx={{
        bgcolor: isDark ? BG : "background.default",
        py: { xs: 10, md: 14 },
        ...(isDark && { position: "relative", overflow: "hidden" }),
      }}
    >
      {isDark ? (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(195,174,97,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            pointerEvents: "none",
          }}
        />
      ) : null}

      <Container maxWidth="md" sx={isDark ? { position: "relative" } : undefined}>
        {header}
        {accordionList}
      </Container>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Box>
  );
}
