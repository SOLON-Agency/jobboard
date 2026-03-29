import type { Metadata } from "next";
import { ThemeRegistry } from "@/theme/ThemeRegistry";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LegalJobs — Legal Career Platform",
    template: "%s | LegalJobs",
  },
  description:
    "Find your next legal career opportunity. Browse jobs from top law firms, apply directly, and manage your legal career.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    siteName: "LegalJobs",
    title: "LegalJobs — Legal Career Platform",
    description:
      "Find your next legal career opportunity. Browse jobs from top law firms.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LegalJobs — Legal Career Platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <Navbar />
          <main style={{ flex: 1 }}>{children}</main>
          <Footer />
        </ThemeRegistry>
      </body>
    </html>
  );
}
