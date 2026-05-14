import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/server-guards";
import { AdminReleasesClient } from "./AdminReleasesClient";

export const metadata: Metadata = {
  title: "Anunțuri noutăți platformă",
  robots: { index: false },
};

export default async function AdminReleasesPage() {
  await requireAdminRole();
  return <AdminReleasesClient />;
}
