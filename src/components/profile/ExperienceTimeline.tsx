import React from "react";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import type { ExperienceItem } from "@/services/experience.service";

interface ExperienceTimelineProps {
  items: ExperienceItem[];
}

const yearRange = (item: ExperienceItem): string => {
  const end = item.is_current ? "prezent" : item.end_year ?? null;
  if (!item.start_year && !end) return "";
  if (item.start_year && !end) return `${item.start_year} — prezent`;
  if (!item.start_year && end) return `— ${end}`;
  return `${item.start_year} — ${end}`;
};

export const ExperienceTimeline: React.FC<ExperienceTimelineProps> = ({ items }) => {
  if (items.length === 0) return null;

  const sorted = [...items].sort(
    (a, b) => Number(b.is_current) - Number(a.is_current) || a.sort_order - b.sort_order
  );

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <WorkOutlineIcon sx={{ color: "text.secondary", fontSize: 22 }} />
        <Typography variant="h4" fontWeight={700}>Experiență profesională</Typography>
      </Stack>

      <Stack spacing={0}>
        {sorted.map((item, idx) => {
          const isLast = idx === sorted.length - 1;
          const range = yearRange(item);

          return (
            <Stack key={item.id} direction="row" spacing={2.5}>
              <Stack alignItems="center" sx={{ flexShrink: 0 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "1.5px solid",
                    borderColor: "secondary.main",
                    color: "secondary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    bgcolor: "background.paper",
                    flexShrink: 0,
                    zIndex: 1,
                  }}
                >
                  {idx + 1}
                </Box>
                {!isLast && (
                  <Box sx={{ width: "1.5px", flex: 1, minHeight: 24, bgcolor: "divider", my: 0.5 }} />
                )}
              </Stack>

              <Box sx={{ pb: isLast ? 0 : 3, flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: range ? 0.25 : 0 }}>
                  {range && (
                    <Typography variant="caption"
                      sx={{ color: "secondary.main", fontWeight: 700, letterSpacing: 0.3 }}>
                      {range}
                    </Typography>
                  )}
                  {item.is_current && (
                    <Chip label="Prezent" size="small" color="success" variant="outlined"
                      sx={{ height: 18, fontSize: "0.62rem", fontWeight: 700 }} />
                  )}
                </Stack>
                <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                  {item.title} ({item.company})
                </Typography>
                {item.description && (
                  <Typography variant="body2" color="text.secondary"
                    sx={{ mt: 0.75, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    {item.description}
                  </Typography>
                )}
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
};
