/**
 * Writes src/types/database.ts from Supabase when the CLI can reach a schema.
 * Always exits 0 so `npm run codegen:zod` still runs against the existing file.
 *
 * Tries, in order:
 *   1. `supabase gen types --linked`
 *   2. `SUPABASE_PROJECT_ID` → `supabase gen types --project-id …`
 *
 * Loads repo-root `.env` so `SUPABASE_PROJECT_ID` matches other CLI scripts.
 */
import dotenv from "dotenv";
import { spawnSync } from "node:child_process";
import { existsSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env") });
const out = path.join(root, "src/types/database.ts");
const tmp = `${out}.tmp`;
const supabaseBin = path.join(root, "node_modules/.bin/supabase");

function runSupabase(args) {
  if (!existsSync(supabaseBin)) {
    console.warn("codegen:types — Supabase CLI missing. Run npm install.");
    return null;
  }
  const r = spawnSync(supabaseBin, args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) {
    return null;
  }
  const stdout = r.stdout ?? "";
  if (!stdout.includes("export type Database")) {
    return null;
  }
  return stdout;
}

const attempts = [["gen", "types", "--linked"]];
const projectId = process.env.SUPABASE_PROJECT_ID?.trim();
if (projectId) {
  attempts.push(["gen", "types", "--project-id", projectId]);
}

let body = null;
for (const args of attempts) {
  body = runSupabase(args);
  if (body) {
    console.log(`codegen:types — OK (supabase ${args.join(" ")})`);
    break;
  }
}

if (!body) {
  try {
    unlinkSync(tmp);
  } catch {
    /* noop */
  }
  console.warn(
    "codegen:types — skipped (supabase link your project or set SUPABASE_PROJECT_ID in .env).",
  );
  process.exit(0);
}

writeFileSync(tmp, body);
renameSync(tmp, out);
process.exit(0);
