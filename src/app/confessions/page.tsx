import type { Metadata } from "next";
import ConfessionsFeedClient from "./ConfessionsFeedClient";
import { buildCanonical } from "../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Anonymous Confessions";
  const description = "Read anonymous public confessions from the latest posts.";
  const canonical = buildCanonical("/confessions");

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: "Anonymous Confessions | ShabadLok",
      description,
      url: canonical,
      type: "website",
    },
  };
}

export default function ConfessionsPage() {
  return (
    <div className="stack">
      <h1 className="page-title">Anonymous Confessions</h1>
      <p className="muted-text" style={{ margin: 0 }}>
        Write what you can&apos;t say out loud.
      </p>
      <ConfessionsFeedClient />
    </div>
  );
}
