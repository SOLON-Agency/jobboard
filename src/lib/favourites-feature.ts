import { favouritesFlag } from "@/flags";

/**
 * Server-side: evaluates the `favourites` flag (`src/flags.ts`).
 * Requires `FLAGS` / Vercel env for live toggling; otherwise stays `false` (see flag `decide` / `defaultValue`).
 */
export async function getFavouritesEnabled(): Promise<boolean> {
  try {
    return await favouritesFlag();
  } catch {
    return false;
  }
}
