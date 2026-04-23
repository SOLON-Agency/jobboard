"use client";

import { Paper } from "@mui/material";
import type { PaperProps } from "@mui/material";

interface BorderedCardProps extends PaperProps {
  /** Inner padding (MUI spacing units). Defaults to 3. */
  p?: number | string;
}

/**
 * A `Paper` with the standard card border and radius — driven by the MUI
 * `Paper` `outlined` variant theme override (1px divider, borderRadius 16px).
 *
 * @pattern BorderedCard
 * @usedBy DashboardContent, forms/page, forms/[id]/responses/page
 * @example
 * ```tsx
 * <BorderedCard p={3}>
 *   <Typography variant="h6">Titlu</Typography>
 * </BorderedCard>
 * ```
 */
export function BorderedCard({ p = 3, sx, children, ...rest }: BorderedCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p,
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Paper>
  );
}
