import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(2, "Numele companiei este obligatoriu"),
  description: z.string().optional().or(z.literal("")),
  website: z.string().url("Introduceți un URL valid").optional().or(z.literal("")),
  industry: z.string().optional().or(z.literal("")),
  size: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  founded_year: z.string().optional(),
});

export type CompanyFormData = z.infer<typeof companySchema>;
