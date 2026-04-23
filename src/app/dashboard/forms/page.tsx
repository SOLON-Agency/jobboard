import type { Metadata } from "next";
import { requireEmployerRole } from "@/lib/server-guards";
import { FormsClient } from "./FormsClient";

export const metadata: Metadata = {
  title: "Formulare",
  robots: { index: false },
};

export default async function FormsPage() {
  await requireEmployerRole();
  return <FormsClient />;
}
