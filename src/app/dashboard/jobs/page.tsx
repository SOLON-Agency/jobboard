import type { Metadata } from "next";
import { JobsClient } from "./JobsClient";

export const metadata: Metadata = {
  title: "Anunțurile mele",
  robots: { index: false },
};

export default function JobsPage() {
  return <JobsClient />;
}
