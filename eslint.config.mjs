import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { supabaseFromBoundaryIgnores } from "./eslint/supabase-from-boundary-allowlist.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // CommonJS tooling — require() is intentional.
  {
    name: "commonjs-tooling",
    files: ["e2e/**/*.js", "scripts/**/*.{js,cjs,mjs}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Deno Edge Functions — dynamic Supabase/JSON payloads; keep Deno lint in-function.
  {
    name: "supabase-edge-functions",
    files: ["supabase/functions/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    name: "supabase-from-boundary",
    files: ["src/**/*.{ts,tsx}"],
    ignores: supabaseFromBoundaryIgnores,
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.property.name='from']:not([callee.object.type='Identifier'][callee.object.name='Array'])",
          message:
            "Supabase queries belong in src/services/*.service.ts (.from / .storage.from). Listed exceptions: eslint/supabase-from-boundary-allowlist.mjs",
        },
      ],
    },
  },
  // eslint-config-next 16.3+ enables react-hooks/set-state-in-effect strictly.
  // Existing data-sync patterns (useAsyncData, prop→state sync) remain valid;
  // migrate gradually rather than blocking dependency upgrades.
  {
    name: "react-hooks-upgrade-compat",
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
