import { z } from "zod";

const yearField = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || /^\d{4}$/.test(v), "An invalid (ex: 2020)");

export const educationSchema = z
  .object({
    title: z.string().min(1, "Titlul / diploma este obligatorie"),
    institution: z.string().min(1, "Instituția este obligatorie"),
    description: z.string().max(1000, "Maxim 1000 de caractere").optional().or(z.literal("")),
    is_current: z.boolean(),
    start_year: yearField,
    end_year: yearField,
  })
  .superRefine((data, ctx) => {
    const start = data.start_year ? parseInt(data.start_year) : null;
    const end = data.end_year ? parseInt(data.end_year) : null;
    const currentYear = new Date().getFullYear();

    if (start !== null && start > currentYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["start_year"],
        message: "Anul de început nu poate fi în viitor",
      });
    }

    if (!data.is_current && !data.end_year) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_year"],
        message: "Anul de finalizare este obligatoriu",
      });
    }

    if (start !== null && end !== null && end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_year"],
        message: "Anul de finalizare nu poate fi înainte de anul de început",
      });
    }
  });

export type EducationFormData = z.infer<typeof educationSchema>;
