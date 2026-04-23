import { z } from "zod";
import type { JobType, ExperienceLevel } from "@/types";

const jobTypes: [JobType, ...JobType[]] = [
  "full-time",
  "part-time",
  "contract",
  "internship",
  "freelance",
];

const experienceLevels: [ExperienceLevel, ...ExperienceLevel[]] = [
  "entry",
  "mid",
  "senior",
  "lead",
  "executive",
];

export const alertSchema = z
  .object({
    name: z
      .string()
      .min(2, "Numele alertei trebuie să aibă cel puțin 2 caractere.")
      .max(100, "Numele alertei nu poate depăși 100 de caractere."),
    q: z.string().optional(),
    location: z.string().optional(),
    type: z.enum(jobTypes).optional(),
    experience: z.enum(experienceLevels).optional(),
    salaryMin: z.number().min(0).optional(),
    salaryMax: z.number().min(0).optional(),
    remote: z.boolean().optional(),
    minBenefits: z.number().min(0).max(10).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.salaryMin != null &&
      data.salaryMax != null &&
      data.salaryMax < data.salaryMin
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["salaryMax"],
        message: "Salariul maxim trebuie să fie mai mare decât salariul minim.",
      });
    }
  });

export type AlertFormData = z.infer<typeof alertSchema>;
