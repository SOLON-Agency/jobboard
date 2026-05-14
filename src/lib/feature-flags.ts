import appSettings from "@/config/app.settings.json";
import { notFound } from "next/navigation";

export type FeatureFlag = keyof typeof appSettings.features;

/**
 * Returns true when the given feature flag is enabled in app.settings.json.
 * Safe to call in both Server and Client Components.
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return Boolean(appSettings.features[flag]);
}

/**
 * Server-only guard — calls Next.js `notFound()` when the feature is disabled.
 * Place at the top of any page/route/Server Action that should be 404 when off.
 */
export function assertFeatureEnabled(flag: FeatureFlag): void {
  if (!isFeatureEnabled(flag)) notFound();
}
