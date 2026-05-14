import { createFlagsDiscoveryEndpoint, getProviderData } from "flags/next";
import type { NextRequest } from "next/server";
import * as flags from "@/flags";

export const GET = createFlagsDiscoveryEndpoint(async (request: NextRequest) => {
  void request;
  return getProviderData(flags);
});
