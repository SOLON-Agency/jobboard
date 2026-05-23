import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { supabaseFromBoundaryIgnores } from "./eslint/supabase-from-boundary-allowlist.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
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
]);

export default eslintConfig;
