/**
 * Types, constants, and Zod schemas for the form-builder (AddEditForm).
 * Icons that require JSX are kept co-located with the component.
 */

import { z } from "zod";

export type FieldType =
  | "text"
  | "number"
  | "textarea"
  | "radio"
  | "checkbox"
  | "upload"
  | "email"
  | "phone";

export interface FormField {
  id?: string;
  field_type: FieldType;
  label: string;
  placeholder: string;
  is_required: boolean;
  /** Comma-separated options string for radio / checkbox */
  options_raw: string;
  sort_order: number;
}

/** Renamed from `FormData` to avoid shadowing the browser global. */
export interface FormBuilderData {
  name: string;
  description: string;
  company_id: string;
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Câmp text",
  email: "Adresă email",
  phone: "Număr de telefon",
  number: "Număr",
  textarea: "Text lung",
  radio: "Selecție unică (radio)",
  checkbox: "Selecție multiplă",
  upload: "Încărcare fișier",
};

export const FIELD_WITH_OPTIONS: FieldType[] = ["radio", "checkbox"];
export const FIELD_WITH_PLACEHOLDER: FieldType[] = [
  "text",
  "number",
  "textarea",
  "email",
  "phone",
];

export const emptyField = (order: number): FormField => ({
  field_type: "text",
  label: "",
  placeholder: "",
  is_required: false,
  options_raw: "",
  sort_order: order,
});

export const fieldTypeSchema = z.enum([
  "text",
  "number",
  "textarea",
  "radio",
  "checkbox",
  "upload",
  "email",
  "phone",
]);

export const formFieldSchema = z
  .object({
    id: z.string().optional(),
    field_type: fieldTypeSchema,
    label: z.string().min(1, "Eticheta este obligatorie"),
    placeholder: z.string(),
    is_required: z.boolean(),
    options_raw: z.string(),
    sort_order: z.number(),
  })
  .superRefine((field, ctx) => {
    if (FIELD_WITH_OPTIONS.includes(field.field_type) && !field.options_raw.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Adaugă cel puțin o opțiune",
        path: ["options_raw"],
      });
    }
  });

export const createFormBuilderSchema = (requireCompany: boolean) =>
  z
    .object({
      name: z.string().min(1, "Numele formularului este obligatoriu"),
      description: z.string(),
      company_id: z.string(),
      fields: z.array(formFieldSchema),
    })
    .superRefine((data, ctx) => {
      if (requireCompany && !data.company_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selectează o societate",
          path: ["company_id"],
        });
      }
    });

export type FormBuilderFormData = z.infer<ReturnType<typeof createFormBuilderSchema>>;
