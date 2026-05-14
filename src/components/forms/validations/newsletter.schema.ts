import { z } from "zod";

export const newsletterSchema = z.object({
  email: z
    .string()
    .email("Adresă de email invalidă")
    .max(254, "Adresa de email este prea lungă"),
  source: z.string().max(40).optional(),
});

export type NewsletterFormData = z.infer<typeof newsletterSchema>;
