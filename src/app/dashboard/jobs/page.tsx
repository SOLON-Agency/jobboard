import type { Metadata } from "next";
import { requireEmployerRole } from "@/lib/server-guards";
import { JobsClient } from "./JobsClient";

export const metadata: Metadata = {
  title: "Anunțurile mele",
  robots: { index: false },
};

export default async function JobsPage() {
  await requireEmployerRole();
  return <JobsClient />;
}
