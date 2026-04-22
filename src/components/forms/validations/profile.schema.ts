import { z } from "zod";

export const profileSchema = z.object({
  email: z.string().email("Introdu o adresă email validă"),
  phone: z.string().optional().or(z.literal("")),
  full_name: z.string().min(2, "Numele trebuie să aibă cel puțin 2 caractere"),
  headline: z.string().max(120).optional().or(z.literal("")),
  bio: z.string().max(2000).optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  experience_level: z.string().optional().or(z.literal("")),
  is_public: z.boolean(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
