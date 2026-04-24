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
  published_at: z.string().min(1, "Data publicării este obligatorie"),
  expires_at: z.string().min(1, "Data expirării este obligatorie"),
  job_type: z.string().optional().or(z.literal("")),
  experience_level: z.array(z.string()),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  is_remote: z.boolean(),
  application_method: z.enum(["none", "url", "form"]),
  application_url: z
    .string()
    .optional()
    .or(z.literal("")),
  form_id: z.string().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (data.published_at && data.expires_at) {
    const pub = new Date(data.published_at);
    const exp = new Date(data.expires_at);
    if (exp <= pub) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expires_at"],
        message: "Data expirării trebuie să fie după data publicării",
      });
    }
  }

  if (data.application_method === "url") {
    const val = data.application_url ?? "";
    if (!val.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["application_url"],
        message: "URL-ul sau adresa de email este obligatorie",
      });
    } else if (
      !z.string().url().safeParse(val).success &&
      !z.string().email().safeParse(val).success
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["application_url"],
        message: "Introdu un URL valid (https://...) sau o adresă de email",
      });
    }
  }
});

export type JobFormData = z.infer<typeof jobSchema>;
