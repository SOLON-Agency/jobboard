import type { Metadata } from "next";
import { ResponsesClient } from "./ResponsesClient";

export const metadata: Metadata = {
  title: "Răspunsuri formular",
  robots: { index: false },
};

export default function FormResponsesPage() {
  return <ResponsesClient />;
}
