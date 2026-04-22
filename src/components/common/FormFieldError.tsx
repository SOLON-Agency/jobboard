"use client";

import { FormHelperText } from "@mui/material";
import type { FieldError } from "react-hook-form";

interface FormFieldErrorProps {
  error?: FieldError;
  id?: string;
}

/**
 * Renders a react-hook-form field error as an accessible `<FormHelperText>` with
 * `role="alert"` so screen readers announce the error immediately.
 *
 * Link the field and this component via `aria-describedby`:
 * ```tsx
 * <TextField inputProps={{ "aria-describedby": "email-error" }} />
 * <FormFieldError id="email-error" error={errors.email} />
 * ```
 *
 * @pattern FormValidation
 * @usedBy All RHF forms
 * @example
 * ```tsx
 * import { FormFieldError } from "@/components/common/FormFieldError";
 * <FormFieldError id="name-error" error={errors.name} />
 * ```
 */
export function FormFieldError({ error, id }: FormFieldErrorProps) {
  if (!error?.message) return null;
  return (
    <FormHelperText id={id} error role="alert">
      {error.message}
    </FormHelperText>
  );
}
