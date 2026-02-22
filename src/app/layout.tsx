import type { Metadata } from "next";
import Link from "next/link";
import Header from "./components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Shayari Hub | Share Your Words",
    template: "%s | Shayari Hub",
  },
  description: "Discover, write, and share shayari with writers from around the world.",
  openGraph: {
    title: "Shayari Hub",
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
        <Header />
        <main className="app-shell">{children}</main>
        <footer className="app-footer">
          <div className="footer-links">
            <Link href="/about" className="inline-link">
              About
            </Link>
            <Link href="/contact" className="inline-link">
              Contact
            </Link>
            <a href="#" className="inline-link" aria-label="Instagram placeholder">
              Instagram
            </a>
            <a href="#" className="inline-link" aria-label="X placeholder">
              X
            </a>
          </div>
          <p className="muted-text">(c) {new Date().getFullYear()} Shayari Hub. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}

