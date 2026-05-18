/**
 * supazod emits recursive `jsonSchema` without an explicit annotation; strict TS fails.
 * Runs after `supazod` in `npm run codegen:zod`.
 *
 * Uses a local `JsonLike` alias (matches Postgres Json / Supabase `Json`) because the file's
 * `export type Json = z.infer<typeof jsonSchema>` is declared after `jsonSchema`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "src/types/database.zod.ts");

let s = readFileSync(target, "utf8");

s = s.replace(/^import type \{ Json \} from "\.\/database";\r?\n/m, "");

const zImport = `import { z } from "zod";`;
const jsonLikeBlock = `
/** Recursive JSON (aligned with \`Database[\"public\"][\"Views\"]\` Json columns). Patched after supazod. */
type JsonLike =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonLike | undefined }
  | JsonLike[];

`;

if (!s.includes("type JsonLike =")) {
  if (!s.includes(zImport)) {
    console.warn("patch-database-zod-json: missing zod import — skip.");
    process.exit(0);
  }
  s = s.replace(zImport, `${zImport}${jsonLikeBlock}`);
}

const lazyNeedle = "export const jsonSchema = z.lazy(() =>";
const lazyTyped =
  "export const jsonSchema: z.ZodType<JsonLike | null> = z.lazy(() =>";

if (s.includes(lazyNeedle)) {
  s = s.replace(lazyNeedle, lazyTyped);
} else if (!s.includes("jsonSchema: z.ZodType<JsonLike | null>")) {
  console.warn("patch-database-zod-json: jsonSchema pattern not found — skip.");
}

writeFileSync(target, s);
