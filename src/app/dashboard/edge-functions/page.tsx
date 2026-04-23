import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/server-guards";
import { EdgeFunctionsClient } from "./EdgeFunctionsClient";

export const metadata: Metadata = {
  title: "Edge Functions – Test",
  robots: { index: false, follow: false },
};

export default async function EdgeFunctionsTestPage() {
  await requireAdminRole();
  return <EdgeFunctionsClient />;
}
