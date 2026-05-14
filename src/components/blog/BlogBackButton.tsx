"use client";

import Link from "next/link";
import { Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export function BlogBackButton() {
  return (
    <Button
      component={Link}
      href="/dashboard/blog"
      startIcon={<ArrowBackIcon />}
      variant="outlined"
      size="small"
    >
      Înapoi la Blog
    </Button>
  );
}
