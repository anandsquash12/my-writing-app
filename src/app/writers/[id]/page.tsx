import type { Metadata } from "next";
import WriterProfileClient from "./WriterProfileClient";
import { buildCanonical } from "../../lib/seo";

interface WriterProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: WriterProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const writerId = decodeURIComponent(id || "");
  const canonical = buildCanonical(`/writers/${encodeURIComponent(writerId)}`);
  return {
    title: "Writer Profile",
    description: `Explore the profile and posts of writer ${writerId} on ShabadLok.`,
    alternates: {
      canonical,
    },
    openGraph: {
      title: "Writer Profile | ShabadLok",
      description: `Explore the profile and posts of writer ${writerId} on ShabadLok.`,
      url: canonical,
      type: "profile",
    },
  };
}

export default async function WriterProfilePage({ params }: WriterProfilePageProps) {
  const { id } = await params;
  return <WriterProfileClient writerId={decodeURIComponent(id || "")} />;
}
