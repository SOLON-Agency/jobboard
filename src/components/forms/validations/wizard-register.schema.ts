import { z } from "zod";

/**
 * Simplified registration schema used inside the AnuntWizard auth gate.
 * Unlike the full RegisterForm, the wizard only collects email + password
 * (the name is set later on the profile page).
 */
export const wizardRegisterSchema = z
  .object({
    email: z.string().email("Email invalid"),
    password: z.string().min(6, "Minim 6 caractere"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Parolele nu corespund",
    path: ["confirmPassword"],
  });

export type WizardRegisterFormData = z.infer<typeof wizardRegisterSchema>;
