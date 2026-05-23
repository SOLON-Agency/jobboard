/**
 * Writes src/types/database.ts from Supabase when the CLI can reach a schema.
 * Always exits 0 so `npm run codegen:zod` still runs against the existing file.
 *
 * Tries, in order:
 *   1. `SUPABASE_PROJECT_ID` → `supabase gen types --project-id … --schema public`
 *   2. `supabase gen types --linked --schema public`
 *
 * Loads `.env.local` + `.env` so `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_ID`
 * match other CLI scripts. Skips the write when output has no public tables (empty
 * schema from API/CLI bugs would break `Tables<"…">` across the app).
 */
import dotenv from "dotenv";
import { spawnSync } from "node:child_process";
import { existsSync, renameSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env.local") });
dotenv.config({ path: path.join(root, ".env") });

const out = path.join(root, "src/types/database.ts");
const tmp = `${out}.tmp`;
const supabaseBin = path.join(root, "node_modules/.bin/supabase");

/** True when generated types include at least one public table Row definition. */
function hasPublicTableTypes(body) {
  return /public:\s*\{[\s\S]*?Tables:\s*\{[\s\S]*?\n\s+[a-z][a-z0-9_]*:\s*\{\s*\n\s+Row:/.test(
    body,
  );
}

function runSupabase(args) {
  if (!existsSync(supabaseBin)) {
    console.warn("codegen:types — Supabase CLI missing. Run npm install.");
    return null;
  }
  const r = spawnSync(supabaseBin, args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    env: process.env,
  });
  if (r.status !== 0) {
    return null;
  }
  const stdout = r.stdout ?? "";
  if (!stdout.includes("export type Database")) {
    return null;
  }
  if (!hasPublicTableTypes(stdout)) {
    console.warn(
      `codegen:types — rejected empty schema (supabase ${args.join(" ")}). Keeping existing database.ts.`,
    );
    return null;
  }
  return stdout;
}

const schemaArgs = ["--schema", "public"];
const attempts = [];
const projectId = process.env.SUPABASE_PROJECT_ID?.trim();
if (projectId) {
  attempts.push(["gen", "types", "--project-id", projectId, ...schemaArgs]);
}
attempts.push(["gen", "types", "--linked", ...schemaArgs]);

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
  if (existsSync(out)) {
    const existing = readFileSync(out, "utf8");
    if (hasPublicTableTypes(existing)) {
      console.warn(
        "codegen:types — skipped (could not fetch schema; keeping committed database.ts).",
      );
    } else {
      console.warn(
        "codegen:types — skipped and database.ts has no public tables — restore from git or fix Supabase CLI link/token.",
      );
    }
  } else {
    console.warn(
      "codegen:types — skipped (supabase link your project or set SUPABASE_PROJECT_ID in .env).",
    );
  }
  process.exit(0);
}

writeFileSync(tmp, body);
renameSync(tmp, out);
process.exit(0);
