/**
 * Feature flags (Flags SDK for Next.js App Router).
 *
 * @see https://flags-sdk.dev/docs/api-reference/frameworks/next
 */

import { flag } from "flags/next";
import { vercelAdapter } from "@flags-sdk/vercel";

function hasVercelFlagsEnv(): boolean {
  return typeof process.env.FLAGS === "string" && process.env.FLAGS.trim().length > 0;
}

/**
 * Job and company favourites.
 * With `FLAGS` (e.g. after `vercel env pull`), values come from Vercel Flags / Toolbar.
 * Without it, `decide` keeps the feature off locally (same as `defaultValue`).
 */
export const favouritesFlag = flag<boolean>({
  key: "favourites",
  description: "Enable favourites functionality on job listings and companies.",
  defaultValue: false,
  options: [
    { value: false, label: "Off" },
    { value: true, label: "On" },
  ],
  ...(hasVercelFlagsEnv()
    ? { adapter: vercelAdapter() }
    : {
        async decide() {
          return false;
        },
      }),
});
