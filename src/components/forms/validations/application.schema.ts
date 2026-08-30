import { z } from "zod";
import type { Tables } from "@/types/database";

type FormFieldSpec = Pick<
  Tables<"form_fields">,
  "id" | "label" | "field_type" | "is_required"
>;

const PHONE_REGEX = /^(\+?\d[\d\s\-().]{6,19}\d)$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fieldValueSchema(field: FormFieldSpec): z.ZodType<string> {
  const requiredMsg = "Câmp obligatoriu";

  switch (field.field_type) {
    case "email":
      if (field.is_required) {
        return z
          .string()
          .min(1, requiredMsg)
          .refine((v) => EMAIL_REGEX.test(v), "Adresă de email invalidă");
      }
      return z
        .string()
        .refine((v) => !v || EMAIL_REGEX.test(v), "Adresă de email invalidă");
    case "phone":
      if (field.is_required) {
        return z
          .string()
          .min(1, requiredMsg)
          .refine((v) => PHONE_REGEX.test(v), "Număr de telefon invalid (ex: 0721 000 000 sau +40 721 000 000)");
      }
      return z
        .string()
        .refine(
          (v) => !v || PHONE_REGEX.test(v),
          "Număr de telefon invalid (ex: 0721 000 000 sau +40 721 000 000)"
        );
    default:
      if (field.is_required) {
        return z.string().min(1, requiredMsg);
      }
      return z.string();
  }
}

/** Build a Zod schema for dynamic application form fields (excludes upload fields). */
export function buildApplicationFormSchema(fields: FormFieldSpec[]) {
  const shape: Record<string, z.ZodType<string>> = {};
  for (const field of fields) {
    if (field.field_type === "upload") continue;
    shape[field.id] = fieldValueSchema(field);
  }
  return z.object(shape);
}

export type ApplicationFormValues = Record<string, string>;

/** Validate required upload fields separately (files are not in RHF state). */
export function validateApplicationUploads(
  fields: FormFieldSpec[],
  fileValues: Record<string, File | null>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (field.field_type === "upload" && field.is_required && !fileValues[field.id]) {
      errors[field.id] = "Câmp obligatoriu";
    }
  }
  return errors;
}
