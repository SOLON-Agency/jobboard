import { z } from "zod";

export const jobSchema = z.object({
  company_id: z.string().min(1, "Selectează o companie"),
  title: z.string().min(3, "Titlul este obligatoriu"),
  description: z
    .string()
    .refine(
      (v) => v.replace(/<[^>]*>/g, "").trim().length >= 10,
      "Descrierea trebuie să aibă cel puțin 10 caractere",
    ),
  location: z.string().optional().or(z.literal("")),
  job_type: z.string().optional().or(z.literal("")),
  experience_level: z.array(z.string()),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  is_remote: z.boolean(),
  application_method: z.enum(["none", "url", "form"]),
  application_url: z.string().url("Introdu un URL valid").optional().or(z.literal("")),
  form_id: z.string().optional().or(z.literal("")),
});

export type JobFormData = z.infer<typeof jobSchema>;
