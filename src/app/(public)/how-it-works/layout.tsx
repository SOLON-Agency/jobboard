import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Learn how to use LegalJobs to find your next legal career opportunity.",
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
