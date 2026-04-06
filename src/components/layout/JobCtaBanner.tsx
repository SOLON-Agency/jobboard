"use client";

import React from "react";
import Link from "next/link";
import { Box, Container, Typography, Button, Stack } from "@mui/material";

export const JobCtaBanner: React.FC = () => (
  <Box
    sx={{
      borderTop: "1px solid",
      borderBottom: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
      py: { xs: 5, md: 7 },
    }}
  >
    <Container maxWidth="lg">
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={{ xs: 3, md: 0 }}
      >
        <Box>
          <Typography
            variant="h2"
            fontWeight={800}
            sx={{ lineHeight: 1.1, mb: 1 }}
          >
            Cel mai complet portal de locuri de muncă.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Înregistrează-te și găsește-ți următorul loc de muncă sau talent de top.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} flexShrink={0}>
          <Button
            component={Link}
            href="/jobs"
            variant="outlined"
            size="large"
            sx={{ borderRadius: 5, px: 3, whiteSpace: "nowrap" }}
          >
            Cauți un loc de muncă?
          </Button>
          <Button
            component={Link}
            href="/register"
            variant="contained"
            size="large"
            sx={{
              borderRadius: 5,
              px: 3,
              whiteSpace: "nowrap",
              fontWeight: 700,
            }}
          >
            Publică un anunț
          </Button>
        </Stack>
      </Stack>
    </Container>
  </Box>
);
