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
      ? "linear-gradient(135deg, #748CAB 0%, #c3ae61 100%)"
      : "linear-gradient(135deg, #03170C 0%, #3E5C76 100%)";

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
