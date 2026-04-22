"use client";

import { useEffect } from "react";
import { Box, Button, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "40vh",
        gap: 2,
        textAlign: "center",
        px: 2,
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 48, color: "error.main" }} />
      <Typography variant="h5" fontWeight={600}>
        Ceva a mers prost
      </Typography>
      <Typography variant="body2" color="text.secondary">
        A apărut o eroare neașteptată. Încearcă din nou.
      </Typography>
      <Button variant="contained" onClick={reset}>
        Încearcă din nou
      </Button>
    </Box>
  );
}
