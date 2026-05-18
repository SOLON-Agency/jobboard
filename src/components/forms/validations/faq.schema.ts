import { z } from "zod";

export const faqPlacementSchema = z.enum(["home", "how_it_works", "both"]);

export const faqSchema = z.object({
  placement: faqPlacementSchema,
  question: z
    .string()
    .min(1, "Întrebarea este obligatorie")
    .max(500, "Întrebarea nu poate depăși 500 de caractere"),
  answer: z
    .string()
    .min(1, "Răspunsul este obligatoriu")
    .max(12000, "Răspunsul nu poate depăși 12000 de caractere"),
  sort_order: z.preprocess(
    (val) => {
      if (typeof val === "number" && Number.isFinite(val)) return val;
      if (typeof val === "string" && val.trim() !== "") {
        const n = Number(val);
        return Number.isFinite(n) ? n : 0;
      }
      return 0;
    },
    z.number().int().min(0, "Minimum 0").max(99999, "Maximum depășit")
  ),
  is_active: z.boolean(),
});

export type FaqFormData = z.infer<typeof faqSchema>;
