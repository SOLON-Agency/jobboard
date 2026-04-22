import type { Metadata } from "next";
import { FormsClient } from "./FormsClient";

export const metadata: Metadata = {
  title: "Formulare",
  robots: { index: false },
};

export default function FormsPage() {
  return <FormsClient />;
}
