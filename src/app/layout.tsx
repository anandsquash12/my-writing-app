import type { Metadata } from "next";
import Link from "next/link";
import AppProviders from "./components/AppProviders";
import NavBar from "./components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ShabadLok | Share Your Words",
    template: "%s | ShabadLok",
  },
  description: "Discover, write, and share shayari with writers from around the world.",
  openGraph: {
    title: "ShabadLok",
    description: "Discover, write, and share shayari with writers from around the world.",
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
      <body>
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
            <p className="muted-text">© {new Date().getFullYear()} ShabadLok</p>
          </footer>
        </AppProviders>
      </body>
    </html>
  );
}
