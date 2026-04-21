import { z } from "zod";

export const sendEmailTestSchema = z.object({
  to: z.string().min(1, "Adresa de e-mail este obligatorie").email("Introduceți o adresă de e-mail validă"),
  subject: z.string().min(1, "Subiectul este obligatoriu"),
  body: z.string().min(1, "Conținutul mesajului este obligatoriu"),
});

export type SendEmailTestFormData = z.infer<typeof sendEmailTestSchema>;
