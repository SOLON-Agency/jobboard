import type { Metadata } from "next";
import { Saira } from "next/font/google";
import { ThemeRegistry } from "@/theme/ThemeRegistry";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { generateWebSiteJsonLd } from "@/lib/seo";
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
    locale: "ro_RO",
    title: `${appSettings.name} — Platformă de carieră juridică`,
    description:
      "Găsește-ți următoarea oportunitate în cariera juridică. Răsfoiește locuri de muncă de la cele mai bune firme de avocatură.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${appSettings.name} — Platformă de carieră juridică`,
    description:
      "Găsește-ți următoarea oportunitate în cariera juridică. Răsfoiește locuri de muncă de la cele mai bune firme de avocatură.",
  },
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const webSiteJsonLd = generateWebSiteJsonLd();
const rootOrgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: appSettings.name,
  url: SITE_URL,
  description:
    "Platformă de carieră juridică din România. Locuri de muncă pentru avocați, juriști și consilieri juridici.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className={saira.variable}>
      <body style={{ fontFamily: "var(--font-saira), sans-serif" }}>
        <ThemeRegistry>
          {/* Skip navigation — visible only on keyboard focus via CSS */}
          <a href="#main-content" className="skip-nav">
            Sari la conținut
          </a>
          <Navbar />
          <main id="main-content" style={{ flex: 1 }} className="main-content">
            {children}
          </main>
          <Footer />
        </ThemeRegistry>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootOrgJsonLd) }}
        />
      </body>
    </html>
  );
}
