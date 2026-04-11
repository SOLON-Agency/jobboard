/**
 * Types and constants for the form-builder (AddEditForm).
 * Icons that require JSX are kept co-located with the component.
 */

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
