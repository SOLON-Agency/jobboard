import { z } from "zod";

export const blogPostSchema = z
  .object({
    title: z
      .string()
      .min(3, "Titlul trebuie să aibă cel puțin 3 caractere")
      .max(200, "Titlul nu poate depăși 200 de caractere"),
    slug: z
      .string()
      .min(3, "Slug-ul trebuie să aibă cel puțin 3 caractere")
      .max(120, "Slug-ul nu poate depăși 120 de caractere")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug invalid — folosește numai litere mici, cifre și cratime"
      ),
    excerpt: z
      .string()
      .max(300, "Rezumatul nu poate depăși 300 de caractere")
      .optional()
      .or(z.literal("")),
    cover_image_url: z
      .string()
      .url("URL imagine invalid")
      .optional()
      .or(z.literal("")),
    content_markdown: z
      .string()
      .min(50, "Conținutul este prea scurt (minimum 50 de caractere)"),
    status: z.enum(["draft", "published", "archived"]),
    seo_title: z
      .string()
      .max(70, "SEO titlu — maximum 70 caractere")
      .optional()
      .or(z.literal("")),
    seo_description: z
      .string()
      .max(160, "SEO descriere — maximum 160 de caractere")
      .optional()
      .or(z.literal("")),
    tags: z
      .array(z.string().min(1).max(40))
      .max(10, "Maximum 10 etichete"),
    canonical_url: z
      .string()
      .url("URL canonic invalid")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((values, ctx) => {
    if (values.status === "published" && !values.cover_image_url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cover_image_url"],
        message: "Imaginea de copertă este obligatorie la publicare",
      });
    }
  });

export type BlogPostFormData = z.infer<typeof blogPostSchema>;
