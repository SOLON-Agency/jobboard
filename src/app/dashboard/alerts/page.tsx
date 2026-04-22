import type { Metadata } from "next";
import { AlertsClient } from "./AlertsClient";

export const metadata: Metadata = {
  title: "Job Alerts",
  robots: { index: false },
};

export default function AlertsPage() {
  return <AlertsClient />;
}
