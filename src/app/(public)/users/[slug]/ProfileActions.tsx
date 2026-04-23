"use client";

import React from "react";
import { Button, Stack, Tooltip } from "@mui/material";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import DownloadIcon from "@mui/icons-material/Download";

interface ProfileActionsProps {
  cvDownloadUrl?: string | null;
}

export function ProfileActions({ cvDownloadUrl }: ProfileActionsProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ flexShrink: 0, pt: 1.5 }}>
      {/* Share — full label on md+, icon-only on mobile */}
      <Button
        variant="outlined"
        size="medium"
        startIcon={<ShareOutlinedIcon sx={{ fontSize: "16px !important" }} />}
        sx={{
          borderRadius: 5,
          fontWeight: 700,
          display: { xs: "none", md: "inline-flex" },
        }}
        aria-label="Trimite"
      >
        Trimite
      </Button>
      <Tooltip title="Trimite">
        <Button
          variant="outlined"
          size="medium"
          aria-label="Trimite"
          sx={{
            borderRadius: 5,
            minWidth: 0,
            px: 1.5,
            display: { xs: "inline-flex", md: "none" },
          }}
        >
          <ShareOutlinedIcon fontSize="small" />
        </Button>
      </Tooltip>

      {/* CV download */}
      {cvDownloadUrl && (
        <>
          <Button
            component="a"
            href={cvDownloadUrl}
            download
            variant="contained"
            size="medium"
            endIcon={<DownloadIcon sx={{ fontSize: "16px !important" }} />}
            sx={{
              borderRadius: 5,
              fontWeight: 700,
              bgcolor: "text.primary",
              color: "background.paper",
              "&:hover": { bgcolor: "text.secondary" },
              display: { xs: "none", sm: "inline-flex" },
            }}
          >
            Descarcă CV
          </Button>
          <Tooltip title="Descarcă CV">
            <Button
              component="a"
              href={cvDownloadUrl}
              download
              variant="contained"
              size="medium"
              aria-label="Descarcă CV"
              sx={{
                borderRadius: 5,
                minWidth: 0,
                px: 1.5,
                bgcolor: "text.primary",
                color: "background.paper",
                "&:hover": { bgcolor: "text.secondary" },
                display: { xs: "inline-flex", sm: "none" },
              }}
            >
              <DownloadIcon fontSize="small" />
            </Button>
          </Tooltip>
        </>
      )}
    </Stack>
  );
}
