"use client";

import React from "react";
import { Typography, useTheme } from "@mui/material";
import type { TypographyProps } from "@mui/material";

export const GradientText: React.FC<TypographyProps> = ({
  children,
  sx,
  ...props
}) => {
  const theme = useTheme();
  const gradient =
    theme.palette.mode === "dark"
      ? "linear-gradient(135deg, #00f0ff 0%, #7b2ff7 100%)"
      : "linear-gradient(135deg, #00c2d1 0%, #7b2ff7 100%)";

  return (
    <Typography
      sx={{
        background: gradient,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        ...sx,
      }}
      {...props}
    >
      {children}
    </Typography>
  );
};
