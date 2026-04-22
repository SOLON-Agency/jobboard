"use client";

import { Paper } from "@mui/material";
import type { PaperProps } from "@mui/material";

interface BorderedCardProps extends PaperProps {
  /** Inner padding (MUI spacing units). Defaults to 3. */
  p?: number | string;
}

/**
 * A `Paper` with a `1px divider` border and `borderRadius: 2` — the most
 * frequently repeated card pattern across dashboard and forms pages.
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
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p,
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Paper>
  );
}
