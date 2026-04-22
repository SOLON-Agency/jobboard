import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Numele trebuie să aibă cel puțin 2 caractere"),
    email: z.string().email("Introduceți o adresă de e-mail validă"),
    password: z.string().min(6, "Parola trebuie să aibă cel puțin 6 caractere"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Parolele nu corespund",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
