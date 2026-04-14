"use client";

import React, { useState } from "react";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import type { ProfileSkillWithName } from "@/services/skills.service";

const MAX_VISIBLE = 9;

interface SkillsDisplayProps {
  items: ProfileSkillWithName[];
}

export const SkillsDisplay: React.FC<SkillsDisplayProps> = ({ items }) => {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  const overflow = items.length - MAX_VISIBLE;
  const visible = expanded || overflow <= 0 ? items : items.slice(0, MAX_VISIBLE);

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Competențe
        </Typography>
      </Stack>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {visible.map((item) => (
          <Chip
            key={item.id}
            label={item.skill.name}
            sx={{
              bgcolor: "rgba(3, 23, 12, 0.06)",
              color: "text.primary",
              fontWeight: 500,
              border: "none",
              borderRadius: "20px",
              "&:hover": { bgcolor: "rgba(3, 23, 12, 0.1)" },
            }}
          />
        ))}

        {!expanded && overflow > 0 && (
          <Chip
            label={`${overflow}+`}
            onClick={() => setExpanded(true)}
            sx={{
              bgcolor: "#c3ae61",
              color: "#03170C",
              fontWeight: 700,
              border: "none",
              borderRadius: "20px",
              cursor: "pointer",
              "&:hover": { bgcolor: "#b09a50" },
            }}
          />
        )}

        {expanded && overflow > 0 && (
          <Chip
            label="Restrânge"
            onClick={() => setExpanded(false)}
            variant="outlined"
            sx={{
              fontWeight: 500,
              borderRadius: "20px",
              cursor: "pointer",
            }}
          />
        )}
      </Box>
    </Paper>
  );
};
