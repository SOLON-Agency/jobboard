import type { Metadata } from "next";
import { requireEmployerRole } from "@/lib/server-guards";
import { CandidatesOverviewClient } from "./CandidatesOverviewClient";

export const metadata: Metadata = {
  title: "Toți candidații",
  robots: { index: false },
};

export default async function CandidatesPage() {
  await requireEmployerRole();
  return <CandidatesOverviewClient />;
}
