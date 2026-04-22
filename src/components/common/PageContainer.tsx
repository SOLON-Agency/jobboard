"use client";

import { Container } from "@mui/material";
import type { ContainerProps, SxProps, Theme } from "@mui/material";

type PageVariant = "default" | "auth" | "wide" | "form";

const variantMaxWidth: Record<PageVariant, ContainerProps["maxWidth"]> = {
  default: "lg",
  auth: "sm",
  wide: "xl",
  form: "md",
};

const variantSx: Record<PageVariant, SxProps<Theme>> = {
  default: { py: { xs: 3, md: 6 } },
  auth: { py: { xs: 6, md: 8 } },
  wide: { py: { xs: 3, md: 4 } },
  form: { py: { xs: 3, md: 5 } },
};

interface PageContainerProps extends Omit<ContainerProps, "maxWidth"> {
  variant?: PageVariant;
}

/**
 * Responsive page container with standardised padding for each route type.
 * Replaces ad-hoc `<Container maxWidth="…" sx={{ py: … }}>` repetition.
 *
 * @pattern PageLayout
 * @usedBy dashboard pages, auth pages, listing pages
 * @example
 * ```tsx
 * <PageContainer variant="auth">
 *   <LoginForm />
 * </PageContainer>
 * ```
 */
export function PageContainer({
  variant = "default",
  sx,
  children,
  ...rest
}: PageContainerProps) {
  const maxWidth = variantMaxWidth[variant];
  const presetSx = variantSx[variant];
  return (
    <Container maxWidth={maxWidth} sx={[presetSx, ...(Array.isArray(sx) ? sx : [sx])]} {...rest}>
      {children}
    </Container>
  );
}
