import type { Metadata } from "next";
import { CandidatesClient } from "./CandidatesClient";

export const metadata: Metadata = {
  title: "Candidați",
  robots: { index: false },
};

export default function JobCandidatesPage() {
  return <CandidatesClient />;
}
