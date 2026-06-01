import type { Metadata } from "next";
import Link from "next/link";
import { Cormorant_Garamond, Inter } from "next/font/google";
import AppProviders from "./components/AppProviders";
import { Providers } from "./providers";
import NavBar from "./components/NavBar";
import "./globals.css";

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://my-writing-app-neon.vercel.app"),
  title: {
    default: "ShabadLok | Write. Share. Earn.",
    template: "%s | ShabadLok",
  },
  description: "Write, share, and earn from poetry, lyrics, and stories in a premium social platform for writers.",
  alternates: {
    canonical: "https://my-writing-app-neon.vercel.app",
  },
  openGraph: {
    title: "ShabadLok",
    description: "Turn your poetry, lyrics, and stories into income with a premium platform built for writers.",
    url: "https://my-writing-app-neon.vercel.app",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <Providers>
          <AppProviders>
            <NavBar />
            <main className="app-shell">{children}</main>
            <footer className="app-footer">
              <div className="footer-links">
                <Link href="/about" className="inline-link">
                  About
                </Link>
                <Link href="/contact" className="inline-link">
                  Contact
                </Link>
                <Link href="/privacy" className="inline-link">
                  Privacy
                </Link>
                <Link href="/terms" className="inline-link">
                  Terms
                </Link>
              </div>
              <p className="muted-text">Built for writers who want audience, trust, and income.</p>
              <p className="muted-text">© {new Date().getFullYear()} ShabadLok</p>
            </footer>
          </AppProviders>
        </Providers>
      </body>
    </html>
  );
}
