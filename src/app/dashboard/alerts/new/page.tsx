import type { Metadata } from "next";
import { Suspense } from "react";
import { AlertNewClient } from "./AlertNewClient";

export const metadata: Metadata = {
  title: "Creează alertă | Dashboard",
  robots: { index: false },
};

export default function AlertNewPage() {
  return (
    <Suspense>
      <AlertNewClient />
    </Suspense>
  );
}
