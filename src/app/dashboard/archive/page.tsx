import type { Metadata } from "next";
import { ArchiveClient } from "./ArchiveClient";

export const metadata: Metadata = {
  title: "Arhivă",
  robots: { index: false },
};

export default function ArchivePage() {
  return <ArchiveClient />;
}
