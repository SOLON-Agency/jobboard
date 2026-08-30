import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface MetaCellProps {
  label: string;
  value: string;
  icon?: ReactNode;
}

/** Two-line label/value cell for public profile and company pages. */
export function MetaCell({ label, value, icon }: MetaCellProps) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.25 }}>
        {icon}
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ fontWeight: 600, letterSpacing: 0.4 }}
        >
          {label}
        </Typography>
      </Stack>
      <Typography variant="body2" fontWeight={700} color="text.primary">
        {value}
      </Typography>
    </Box>
  );
}
