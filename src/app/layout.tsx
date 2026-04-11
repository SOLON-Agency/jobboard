import type { Metadata } from "next";
import { Saira } from "next/font/google";
import { ThemeRegistry } from "@/theme/ThemeRegistry";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";
import appSettings from "@/config/app.settings.json";

const saira = Saira({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  weight: "variable",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-saira",
});

export const metadata: Metadata = {
  title: {
    default: `${appSettings.name} — Platformă de carieră juridică`,
    template: `%s | ${appSettings.name}`,
  },
  description:
    "Găsește-ți următoarea oportunitate în cariera juridică. Răsfoiește locuri de muncă de la cele mai bune firme de avocatură, aplică direct și gestionează-ți cariera.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    siteName: appSettings.name,
    title: `${appSettings.name} — Platformă de carieră juridică`,
    description:
      "Găsește-ți următoarea oportunitate în cariera juridică. Răsfoiește locuri de muncă de la cele mai bune firme de avocatură.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${appSettings.name} — Platformă de carieră juridică`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={saira.variable}>
      {/* <style dangerouslySetInnerHTML={{ __html: `
        .main-content {
          padding-bottom: 100px;
        }
        @media (min-width: 768px) {
          .main-content {
            padding-bottom: 30px;
          }
        }
      `}} /> */}
      <body style={{ fontFamily: "var(--font-saira), sans-serif" }}>
        <ThemeRegistry>
          <Navbar />
          <main style={{ flex: 1 }} className="main-content">{children}</main>
          <Footer />
        </ThemeRegistry>
      </body>
    </html>
  );
}
