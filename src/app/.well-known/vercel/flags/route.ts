import { createFlagsDiscoveryEndpoint } from "flags/next";
import { getProviderData } from "@flags-sdk/vercel";
import type { NextRequest } from "next/server";
import { favouritesFlag } from "@/flags";

export const GET = createFlagsDiscoveryEndpoint(async (request: NextRequest) => {
  void request;
  return getProviderData({ favouritesFlag });
});
