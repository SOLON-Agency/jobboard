import { Box, Container, Typography } from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { NewsletterSignup } from "./NewsletterSignup";

/**
 * Homepage newsletter section. Server component wrapper that short-circuits
 * when the `blog` feature flag is disabled so no markup is rendered.
 */
export function NewsletterSection() {
  if (!isFeatureEnabled("blog")) return null;

  return (
    <Box
      component="aside"
      aria-labelledby="newsletter-section-heading"
      sx={{
        bgcolor: "primary.main",
        color: "primary.contrastText",
        py: { xs: 6, md: 10 },
      }}
    >
      <Container maxWidth="md">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: { xs: "flex-start", md: "center" },
            textAlign: { xs: "left", md: "center" },
            gap: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <MailOutlineIcon
              sx={{ fontSize: { xs: 32, md: 40 }, opacity: 0.9 }}
              aria-hidden="true"
            />
            <Typography
              id="newsletter-section-heading"
              variant="h3"
              component="h2"
              fontWeight={800}
              sx={{ fontSize: { xs: "1.5rem", sm: "1.875rem", md: "2.25rem" } }}
            >
              Rămâi la curent cu noutățile juridice
            </Typography>
          </Box>

          <Typography
            variant="body1"
            sx={{ opacity: 0.85, maxWidth: 520, lineHeight: 1.7 }}
          >
            Abonează-te și primești direct în inbox fiecare articol nou despre cariera
            juridică, tendințe în recrutare și sfaturi pentru profesioniști din România.
          </Typography>

          <Box sx={{ width: "100%", maxWidth: 540 }}>
            <NewsletterSignup source="homepage" />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
