"use client";

import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import { useAuth } from "@/hooks/useAuth";
import { useFavourites } from "@/hooks/useFavourites";
import appSettings from "@/config/app.settings.json";

interface CompanyFavouriteButtonProps {
  companyId: string;
  companyName?: string;
}

export function CompanyFavouriteButton({
  companyId,
  companyName = "compania",
}: CompanyFavouriteButtonProps) {
  const { user } = useAuth();
  const { isCompanyFavourite, toggleCompany } = useFavourites();

  if (!appSettings.features.favourites || !user) return null;

  const isFav = isCompanyFavourite(companyId);

  return (
    <Tooltip title={isFav ? "Elimină din favorite" : "Salvează compania"}>
      <IconButton
        onClick={() => void toggleCompany(companyId)}
        aria-label={
          isFav
            ? `Elimină ${companyName} din favorite`
            : `Salvează ${companyName} la favorite`
        }
        aria-pressed={isFav}
        size="medium"
        sx={{
          color: isFav ? "error.main" : "text.secondary",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 5,
          "&:hover": { borderColor: "primary.main" },
        }}
      >
        {isFav ? (
          <BookmarkIcon fontSize="small" />
        ) : (
          <BookmarkBorderIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
}
