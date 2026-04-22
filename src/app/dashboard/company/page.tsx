import type { Metadata } from "next";
import { CompanyClient } from "./CompanyClient";

export const metadata: Metadata = {
  title: "Compania mea",
  robots: { index: false },
};

export default function CompanyPage() {
  return <CompanyClient />;
}
