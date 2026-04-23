import type { Metadata } from "next";
import { requireEmployerRole } from "@/lib/server-guards";
import { CompanyClient } from "./CompanyClient";

export const metadata: Metadata = {
  title: "Compania mea",
  robots: { index: false },
};

export default async function CompanyPage() {
  await requireEmployerRole();
  return <CompanyClient />;
}
