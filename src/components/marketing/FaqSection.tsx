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

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: readonly FaqItem[] = [
  {
    question: `Cui se adresează ${appSettings.name}?`,
    answer:
      `${appSettings.name} este construit exclusiv pentru piața juridică din România: cabinete și societăți de avocatură, departamente juridice in-house, avocați definitivi, stagiari, consilieri juridici și agenții de recrutare specializate.`,
  },
  {
    question: "Cât costă publicarea unui anunț?",
    answer:
      "Publicarea anunțurilor este gratuită pentru primele 5 roluri active simultan. Nu cerem card de credit, nu impunem perioade de probă limitate și nu există costuri ascunse pentru funcționalitățile de bază.",
  },
  {
    question: "Ce înseamnă matchmaking inteligent în context juridic?",
    answer:
      "Platforma corelează specializarea, vechimea, jurisdicția și competențele candidaților cu cerințele explicite ale fiecărui anunț. Rezultatul este un set restrâns de potriviri relevante pentru fiecare parte — fără a forța algoritmul pe candidați care nu se aliniază profilului.",
  },
  {
    question: "Cum sunt protejate datele cu caracter personal?",
    answer:
      "Toate datele sunt prelucrate strict conform GDPR. Profesioniștii juridici controlează vizibilitatea profilului, beneficiază de drepturi clare de acces, rectificare și ștergere, iar datele sensibile sunt stocate într-o infrastructură securizată, conformă cu standardele europene.",
  },
  {
    question: "Cum funcționează alertele personalizate?",
    answer:
      "Îți salvezi criteriile (specializare, locație, nivel de experiență, interval salarial) și primești notificări prin e-mail și în browser imediat ce apare un anunț relevant. Astfel poți reacționa rapid, înainte ca poziția să devină saturată cu aplicații.",
  },
  {
    question: "Pot publica anunțuri confidențial pentru clienții mei?",
    answer:
      "Da. Agențiile de recrutare și consultanții pot publica anunțuri folosind brandul propriu sau cu informații parțial confidențiale despre clientul final. Discutăm la cerere setări avansate de confidențialitate pentru rolurile sensibile.",
  },
  {
    question: "Pot edita sau retrage un anunț după publicare?",
    answer:
      "Anunțurile pot fi editate, arhivate sau republicate oricând din dashboard-ul de angajator. Modificările sunt reflectate imediat pentru candidați, iar istoricul aplicațiilor este păstrat pentru continuitate.",
  },
  {
    question: "În cât timp pot publica primul anunț?",
    answer:
      "Crearea contului, configurarea profilului de companie și publicarea primului anunț durează în medie sub 10 minute. Echipa noastră de suport te asistă activ pentru ca primul tău anunț să fie optimizat pentru conversie.",
  },
] as const;

export function FaqSection() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

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
            Răspunsuri pentru{" "}
            <Box
              component="span"
              sx={{
                background: "linear-gradient(135deg, #03170C 0%, #c3ae61 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              cariera și recrutarea ta juridică
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

        <Box>
          {faqs.map((faq, idx) => (
            <Accordion
              key={faq.question}
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
      </Container>

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        // Static content authored above, safe to inline as a stringified JSON-LD payload.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Box>
  );
}
