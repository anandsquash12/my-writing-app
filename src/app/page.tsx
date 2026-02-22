import type { Metadata } from "next";
import Link from "next/link";
import HomeFeedClient from "./components/HomeFeedClient";

export const metadata: Metadata = {
  title: "Home",
  description: "Read trending shayari, discover writers, and publish your own poetry.",
  openGraph: {
    title: "Shayari Hub Home",
    description: "Read trending shayari, discover writers, and publish your own poetry.",
    type: "website",
  },
};

export default function Home() {
  return (
    <div className="stack">
      <section className="hero-card">
        <p className="hero-tag">A Home For Writers</p>
        <h1 className="hero-title">Share words that stay with people.</h1>
        <p className="muted-text" style={{ margin: 0 }}>
          Publish your shayari, connect with readers, and build your writing profile in one place.
        </p>
        <div className="mode-toggle" style={{ marginTop: 8 }}>
          <Link href="/create" className="primary-link">
            Start Writing
          </Link>
          <Link href="/search" className="inline-link">
            Explore Writers
          </Link>
        </div>
      </section>

      <h2 className="page-title">Latest Posts</h2>
      <HomeFeedClient />
    </div>
  );
}
