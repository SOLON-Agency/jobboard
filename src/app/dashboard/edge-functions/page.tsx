import type { Metadata } from "next";
import { EdgeFunctionsClient } from "./EdgeFunctionsClient";

export const metadata: Metadata = {
  title: "Edge Functions – Test",
  robots: { index: false, follow: false },
};

export default function EdgeFunctionsTestPage() {
  return <EdgeFunctionsClient />;
}
