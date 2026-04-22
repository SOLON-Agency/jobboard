"use client";

import { useEffect } from "react";
import { Box, Button, Typography } from "@mui/material";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function JobsError({ error, reset }: ErrorProps) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <Box sx={{ textAlign: "center", py: 8 }}>
      <Typography variant="h5" gutterBottom>Nu am putut încărca joburile</Typography>
      <Button variant="contained" onClick={reset} sx={{ mt: 2 }}>Încearcă din nou</Button>
    </Box>
  );
}
