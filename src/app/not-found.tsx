"use client";

import Link from "next/link";
import { Container, Typography, Button, Box, useTheme } from "@mui/material";

export default function NotFound() {
  const theme = useTheme();
  const gradient =
    theme.palette.mode === "dark"
      ? "linear-gradient(135deg, #748CAB 0%, #c3ae61 100%)"
      : "linear-gradient(135deg, #03170C 0%, #3E5C76 100%)";

  return (
    <Container maxWidth="sm" sx={{ py: 16, textAlign: "center" }}>
      <Typography
        variant="h1"
        sx={{
          fontSize: "8rem",
          fontWeight: 900,
          background: gradient,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          lineHeight: 1,
          mb: 2,
        }}
      >
        404
      </Typography>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Page not found
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </Typography>
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
        <Button component={Link} href="/" variant="contained">
          Go Home
        </Button>
        <Button component={Link} href="/jobs" variant="outlined">
          Browse Jobs
        </Button>
      </Box>
    </Container>
  );
}
