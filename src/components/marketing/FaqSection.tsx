"use client";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import appSettings from "@/config/app.settings.json";
import type { FaqPublicItem } from "@/services/faq.service";

export interface FaqSectionProps {
  items: FaqPublicItem[];
}

export function FaqSection({ items }: FaqSectionProps) {
  const jsonLd =
    items.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }
      : null;

  return (
    <Box
      component="section"
      aria-labelledby="faq-section-heading"
      sx={{ bgcolor: "background.default", py: { xs: 10, md: 14 } }}
    >
      <Container maxWidth="md">
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
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ lineHeight: 1.75, fontSize: { xs: "1rem", md: "1.1rem" } }}
          >
            Cele mai întâlnite întrebări de la candidați și angajatori care fac primii pași pe
            platformă. Dacă ai o întrebare suplimentară, echipa noastră îți răspunde în mai
            puțin de 24 de ore.
          </Typography>
        </Box>

        {items.length === 0 ? (
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ py: 4, maxWidth: 520, mx: "auto", lineHeight: 1.75 }}
            role="status"
          >
            Întrebările frecvente vor apărea aici în curând. Pentru nelămuriri, contactează echipa{" "}
            {appSettings.name}.
          </Typography>
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
        )}
      </Container>

      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
    </Box>
  );
}
