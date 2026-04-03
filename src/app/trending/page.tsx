import type { Metadata } from "next";
import TrendingFeedClient from "../components/TrendingFeedClient";
import { buildCanonical } from "../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Trending";
  const description = "Discover currently trending public posts.";
  const canonical = buildCanonical("/trending");

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: "Trending | ShabadLok",
      description,
      url: canonical,
      type: "website",
    },
  };
}

export default function TrendingPage() {
  return (
    <div className="stack">
      <h1 className="page-title">🔥 Trending Today</h1>
      <p className="muted-text" style={{ margin: 0 }}>
        Ranked by likes, comments, views, and recency boost.
      </p>
      <TrendingFeedClient />
    </div>
  );
}
