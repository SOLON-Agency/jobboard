"use client";

import { useEffect } from "react";
import { Box, Button, Typography } from "@mui/material";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function UserProfileError({ error, reset }: ErrorProps) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <Box sx={{ textAlign: "center", py: 8 }}>
      <Typography variant="h5" gutterBottom>Profilul nu a putut fi încărcat</Typography>
      <Button variant="contained" onClick={reset} sx={{ mt: 2 }}>Încearcă din nou</Button>
    </Box>
  );
}
