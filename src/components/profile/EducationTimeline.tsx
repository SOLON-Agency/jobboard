import React from "react";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import type { EducationItem } from "@/services/education.service";

interface EducationTimelineProps {
  items: EducationItem[];
}

const yearRange = (item: EducationItem): string => {
  const end = item.is_current ? "prezent" : item.end_year ?? null;
  if (!item.start_year && !end) return "";
  if (item.start_year && !end) return `${item.start_year} — prezent`;
  if (!item.start_year && end) return `— ${end}`;
  return `${item.start_year} — ${end}`;
};

export function EducationTimeline({ items }: EducationTimelineProps) {
  if (items.length === 0) return null;

  const sorted = [...items].sort(
    (a, b) => Number(b.is_current) - Number(a.is_current) || a.sort_order - b.sort_order
  );

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <SchoolOutlinedIcon sx={{ color: "text.secondary", fontSize: 22 }} />
        <Typography variant="h4" fontWeight={700}>Educație</Typography>
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
                    borderColor: item.is_current ? "success.main" : "success.main",
                    color: "success.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    bgcolor: item.is_current ? "success.50" : "background.paper",
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
                      sx={{ color: "success.main", fontWeight: 700, letterSpacing: 0.3 }}>
                      {range}
                    </Typography>
                  )}
                  {item.is_current && (
                    <Chip label="Prezent" size="small" color="success" variant="outlined"
                      sx={{ height: 18, fontSize: "0.62rem", fontWeight: 700 }} />
                  )}
                </Stack>
                <Typography variant="subtitle1" fontWeight={700}
                  sx={{ lineHeight: 1.3, mt: range ? 0 : 0 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary"
                  sx={{ fontWeight: 500, mb: item.description ? 0.75 : 0 }}>
                  {item.institution}
                </Typography>
                {item.description && (
                  <Typography variant="body2" color="text.secondary"
                    sx={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
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
