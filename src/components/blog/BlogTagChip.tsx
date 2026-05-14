"use client";

import { Chip } from "@mui/material";
import Link from "next/link";

interface BlogTagChipProps {
  tag: string;
  /** When true, the chip is a link to /blog?tag=... */
  linked?: boolean;
  size?: "small" | "medium";
}

export function BlogTagChip({ tag, linked = false, size = "small" }: BlogTagChipProps) {
  if (linked) {
    return (
      <Chip
        component={Link}
        href={`/blog?tag=${encodeURIComponent(tag)}`}
        label={tag}
        size={size}
        clickable
        sx={{
          fontWeight: 500,
          borderRadius: 1,
          bgcolor: "action.hover",
          "&:hover": { bgcolor: "action.selected" },
          textDecoration: "none",
        }}
      />
    );
  }

  return (
    <Chip
      label={tag}
      size={size}
      sx={{
        fontWeight: 500,
        borderRadius: 1,
        bgcolor: "action.hover",
      }}
    />
  );
}
