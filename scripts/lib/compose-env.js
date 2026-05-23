/**
 * Parse and compose layered env files into the root `.env` used by Next.js and scripts.
 *
 * Layers (later wins on key conflict):
 *   1. `.env.local`  — shared tooling (CLI token, Development flags, localhost URL)
 *   2. `.env.test` or `.env.prod` — branch-matched Supabase + title prefix
 *
 * @see docs/ENVIRONMENTS.md
 */

const fs = require("fs");
const path = require("path");
const { getCurrentBranch, resolveTarget } = require("./environment-targets");

const root = path.resolve(__dirname, "../..");

const FILES = {
  local: path.join(root, ".env.local"),
  test: path.join(root, ".env.test"),
  prod: path.join(root, ".env.prod"),
  output: path.join(root, ".env"),
};

function parseEnvContent(content) {
  /** @type {Map<string, string>} */
  const map = new Map();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);
    if (m) map.set(m[1], unquote(m[2]));
  }
  return map;
}

function unquote(value) {
  const v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    return v.slice(1, -1);
  }
  return v;
}

function formatEnvLine(key, value) {
  if (/[\s#"']/.test(value)) {
    return `${key}="${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return `${key}=${value}`;
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return new Map();
  return parseEnvContent(fs.readFileSync(filePath, "utf8"));
}

/**
 * @param {string} [branch]
 * @returns {{ branch: string, envFile: string, target: ReturnType<typeof resolveTarget>, merged: Map<string, string> }}
 */
function composeEnvLayers(branch = getCurrentBranch()) {
  const target = resolveTarget(branch);
  const envName = branch === "test" ? "test" : "prod";
  const envFile = FILES[envName];

  /** @type {Map<string, string>} */
  const merged = new Map();
  for (const [key, value] of readEnvFile(FILES.local)) merged.set(key, value);
  for (const [key, value] of readEnvFile(envFile)) merged.set(key, value);

  merged.set("SUPABASE_PROJECT_ID", target.supabaseProjectRef);

  if (target.titlePrefix) {
    merged.set("NEXT_PUBLIC_TITLE_PREFIX", target.titlePrefix);
  } else {
    merged.delete("NEXT_PUBLIC_TITLE_PREFIX");
  }

  return { branch, envFile, target, merged };
}

/**
 * @param {string} [branch]
 * @returns {boolean} true when `.env` was written or already up to date
 */
function writeComposedEnv(branch = getCurrentBranch()) {
  const { envFile, target, merged } = composeEnvLayers(branch);
  const envBasename = path.basename(envFile);

  if (!fs.existsSync(FILES.local)) {
    console.warn(
      `\n⚠️  Missing .env.local — copy .env.local.example → .env.local and fill in shared secrets.\n`
    );
    return false;
  }

  if (!fs.existsSync(envFile)) {
    console.warn(
      `\n⚠️  Missing ${envBasename} for branch "${branch}".\n` +
        `   Copy .env.${branch === "test" ? "test" : "prod"}.example → ${envBasename}\n` +
        `   Expected Supabase project: ${target.supabaseProjectRef}\n`
    );
    return false;
  }

  const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  const missing = required.filter((key) => !merged.get(key)?.trim());
  if (missing.length > 0) {
    console.warn(
      `\n⚠️  Missing in ${envBasename}: ${missing.join(", ")}.\n` +
        `   Branch "${branch}" expects Supabase project ${target.supabaseProjectRef}.\n`
    );
    return false;
  }

  const lines = [
    "# Composed by scripts/lib/compose-env.js — do not edit manually.",
    `# Sources: .env.local + ${envBasename} (branch: ${branch})`,
    `# Rebuild: npm run env:sync`,
    "",
  ];

  const sections = [
    {
      title: "Next.js / Supabase (active)",
      keys: [
        "NEXT_PUBLIC_SITE_URL",
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "NEXT_PUBLIC_TITLE_PREFIX",
        "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
        "SUPABASE_PROJECT_ID",
        "SUPABASE_DB_PASSWORD",
      ],
    },
    {
      title: "Vercel Flags (Development — from .env.local)",
      keys: ["FLAGS", "FLAGS_SECRET", "VERCEL_OIDC_TOKEN"],
    },
    {
      title: "Supabase CLI",
      keys: ["SUPABASE_ACCESS_TOKEN"],
    },
    {
      title: "E2E (optional)",
      keys: ["E2E_TEST_EMAIL", "E2E_TEST_PASSWORD"],
    },
    {
      title: "Local reference only (not used by Next.js in production)",
      keys: ["RESEND_API_KEY", "RESEND_FROM"],
    },
  ];

  const written = new Set();
  for (const section of sections) {
    const sectionLines = [];
    for (const key of section.keys) {
      const value = merged.get(key);
      if (value == null || value === "") continue;
      sectionLines.push(formatEnvLine(key, value));
      written.add(key);
    }
    if (sectionLines.length === 0) continue;
    lines.push(`# ── ${section.title} ──`);
    lines.push(...sectionLines);
    lines.push("");
  }

  for (const [key, value] of merged) {
    if (written.has(key) || !value.trim()) continue;
    lines.push(formatEnvLine(key, value));
  }

  const content = lines.join("\n").replace(/\n+$/, "") + "\n";
  const prev = fs.existsSync(FILES.output) ? fs.readFileSync(FILES.output, "utf8") : "";

  if (content === prev) {
    console.log(
      `✅ env:sync — branch "${branch}" → ${target.supabaseProjectRef}` +
        (target.titlePrefix ? `, ${target.titlePrefix} title prefix` : ", no title prefix") +
        ` (.env.local + ${envBasename})`
    );
    return true;
  }

  fs.writeFileSync(FILES.output, content, "utf8");
  console.log(
    `✅ env:sync — wrote .env from .env.local + ${envBasename} → Supabase ${target.supabaseProjectRef}` +
      (target.titlePrefix ? `, NEXT_PUBLIC_TITLE_PREFIX=${target.titlePrefix}` : "")
  );
  return true;
}

module.exports = {
  FILES,
  composeEnvLayers,
  writeComposedEnv,
  parseEnvContent,
  unquote,
  formatEnvLine,
};
