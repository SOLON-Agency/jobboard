/**
 * Vercel Flags — declarations wired to the dashboard (`vercel flags` / Flags SDK).
 *
 * `favourites` default mirrors `features.favourites` in `app.settings.json` (same key name as the Vercel flag).
 *
 * @see https://flags-sdk.dev
 */

import appSettings from "@/config/app.settings.json";
import { flag } from "flags/next";
import { vercelAdapter } from "@flags-sdk/vercel";

/** True when the Vercel Flags SDK can evaluate flags (avoids calling `vercelAdapter()` without config). */
function hasVercelFlagsEnv(): boolean {
  return typeof process.env.FLAGS === "string" && process.env.FLAGS.trim().length > 0;
}

/**
 * `vercelAdapter()` reads `FLAGS` at init and throws if it is missing.
 * Local dev often has no Flags env; use the same value as `defaultValue` without touching Vercel.
 */
function favouritesLocalAdapter() {
  return {
    config: { reportValue: false } as const,
    async decide() {
      return Boolean(appSettings.features.favourites);
    },
  };
}

/** Boolean flag managed in Vercel: george-bratas-projects/jobboard → flag `favourites` */
export const favouritesFlag = flag<boolean>({
  key: "favourites",
  description: "Enable favourites functionality on job listings and companies.",
  defaultValue: Boolean(appSettings.features.favourites),
  options: [
    { value: false, label: "Off" },
    { value: true, label: "On" },
  ],
  adapter: hasVercelFlagsEnv() ? vercelAdapter() : favouritesLocalAdapter(),
});
