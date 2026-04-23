import type { Metadata } from "next";
import { requireEmployerRole } from "@/lib/server-guards";
import { CandidatesClient } from "./CandidatesClient";

export const metadata: Metadata = {
  title: "Candidați",
  robots: { index: false },
};

export default async function JobCandidatesPage() {
  await requireEmployerRole();
  return <CandidatesClient />;
}
