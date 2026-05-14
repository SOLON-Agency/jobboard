import appSettings from "@/config/app.settings.json";
import { favouritesFlag } from "@/flags";

function hasVercelFlagsEnv(): boolean {
  return typeof process.env.FLAGS === "string" && process.env.FLAGS.trim().length > 0;
}

/**
 * Evaluates the `favourites` Vercel Flag (server-side).
 *
 * When `FLAGS` / `FLAGS_SECRET` are not present (e.g. local dev without `vercel env pull`),
 * falls back to `app.settings.json` → `features.favourites`.
 */
export async function getFavouritesEnabled(): Promise<boolean> {
  if (!hasVercelFlagsEnv()) {
    return Boolean(appSettings.features.favourites);
  }
  try {
    return await favouritesFlag();
  } catch {
    return Boolean(appSettings.features.favourites);
  }
}
