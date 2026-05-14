#!/usr/bin/env node
/**
 * Merges a `vercel env pull` output file into `.env` without removing
 * keys that only exist locally (e.g. SUPABASE_ACCESS_TOKEN).
 *
 * Usage: node scripts/merge-vercel-env.cjs <pull-output-file>
 * Default pull file: .env.vercel.pull.tmp (repo root)
 */
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");
const pullPath = path.resolve(process.argv[2] || path.join(root, ".env.vercel.pull.tmp"));

function parseEnvLines(content) {
  /** @type {Map<string, string>} */
  const map = new Map();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (m) map.set(m[1], line);
  }
  return map;
}

function merge() {
  if (!fs.existsSync(pullPath)) {
    console.error("merge-vercel-env: pull file not found:", pullPath);
    process.exit(1);
  }

  const pullMap = parseEnvLines(fs.readFileSync(pullPath, "utf8"));
  if (pullMap.size === 0) {
    console.warn("merge-vercel-env: pull file had no variables; leaving", envPath, "unchanged");
    return;
  }

  let envLines = [];
  if (fs.existsSync(envPath)) {
    envLines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  }

  /** @type {Set<string>} */
  const used = new Set();
  /** @type {string[]} */
  const out = [];

  for (const line of envLines) {
    const trimmed = line.trim();
    const m = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (m && pullMap.has(m[1])) {
      out.push(pullMap.get(m[1]));
      used.add(m[1]);
    } else {
      out.push(line);
    }
  }

  /** @type {string[]} */
  const toAdd = [];
  for (const [k, v] of pullMap) {
    if (!used.has(k)) toAdd.push(v);
  }
  if (toAdd.length > 0) {
    if (out.length && out[out.length - 1] !== "") out.push("");
    out.push("# ── Vercel (merged by scripts/merge-vercel-env.cjs) ──");
    out.push(...toAdd);
  }

  fs.writeFileSync(envPath, out.join("\n").replace(/\n+$/, "") + "\n", "utf8");
  console.log(
    "merge-vercel-env: merged",
    pullMap.size,
    "Vercel key(s) into",
    path.relative(root, envPath)
  );
}

merge();
