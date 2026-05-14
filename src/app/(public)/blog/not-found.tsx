"use client";

import { Box, Button, Container, Typography } from "@mui/material";
import Link from "next/link";

export default function BlogNotFound() {
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 }, textAlign: "center" }}>
      <Typography variant="h2" fontWeight={700} sx={{ mb: 2 }}>
        Articol negăsit
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Articolul pe care îl cauți nu există sau a fost eliminat.
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
        <Button component={Link} href="/blog" variant="contained">
          Înapoi la Blog
        </Button>
        <Button component={Link} href="/" variant="outlined">
          Acasă
        </Button>
      </Box>
    </Container>
  );
}
