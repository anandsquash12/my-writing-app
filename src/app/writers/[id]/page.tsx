import type { Metadata } from "next";
import WriterProfileClient from "./WriterProfileClient";

interface WriterProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: WriterProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Writer Profile",
    description: `Explore the profile and posts of writer ${id} on Shayari Hub.`,
    openGraph: {
      title: "Writer Profile | Shayari Hub",
      description: `Explore the profile and posts of writer ${id} on Shayari Hub.`,
      type: "profile",
    },
  };
}

export default async function WriterProfilePage({ params }: WriterProfilePageProps) {
  const { id } = await params;
  return <WriterProfileClient writerId={decodeURIComponent(id || "")} />;
}
