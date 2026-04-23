import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/server-guards";
import { AdminUsersClient } from "./AdminUsersClient";

export const metadata: Metadata = {
  title: "Administrare utilizatori",
  robots: { index: false },
};

export default async function AdminUsersPage() {
  await requireAdminRole();
  return <AdminUsersClient />;
}
