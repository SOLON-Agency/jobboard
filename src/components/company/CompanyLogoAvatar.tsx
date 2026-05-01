"use client";

import React, { useEffect, useState } from "react";
import { Avatar, type AvatarProps } from "@mui/material";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { normalizeCompanyLogoUrl } from "@/lib/companyLogo";

export interface CompanyLogoAvatarProps {
  logoUrl?: string | null;
  alt?: string;
  size?: number;
  variant?: AvatarProps["variant"];
  sx?: AvatarProps["sx"];
  /** Shown when there is no URL or the image fails to load */
  fallback?: React.ReactNode;
}

export const CompanyLogoAvatar = ({
  logoUrl,
  alt = "",
  size = 44,
  variant,
  sx,
  fallback = <WorkOutlineIcon sx={{ color: "text.secondary", fontSize: 20 }} />,
}: CompanyLogoAvatarProps) => {
  const [failed, setFailed] = useState(false);
  const normalized = normalizeCompanyLogoUrl(logoUrl);

  useEffect(() => {
    setFailed(false);
  }, [logoUrl]);

  const src = failed || !normalized ? undefined : normalized;

  return (
    <Avatar
      src={src}
      alt={alt}
      variant={variant}
      imgProps={{
        onError: () => {
          setFailed(true);
        },
      }}
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        bgcolor: "background.default",
        borderRadius: 0,
        ...sx,
      }}
    >
      {fallback}
    </Avatar>
  );
};
