import type { Metadata } from "next";
import HomeFeedClient from "./components/HomeFeedClient";
import { buildCanonical } from "./lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Home";
  const description = "Read trending shayari, discover writers, and publish your own poetry.";
  const canonical = buildCanonical("/");

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: "Home | ShabadLok",
      description,
      url: canonical,
      type: "website",
    },
  };
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <HomeFeedClient />
      </div>
    </div>
  );
}
