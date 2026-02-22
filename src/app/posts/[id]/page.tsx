import type { Metadata } from "next";
import PostDetailsClient from "./PostDetailsClient";

interface PostDetailsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PostDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Post Details",
    description: `Read and interact with post ${id} on Shayari Hub.`,
    openGraph: {
      title: "Post Details | Shayari Hub",
      description: `Read and interact with post ${id} on Shayari Hub.`,
      type: "article",
    },
  };
}

export default async function PostDetailsPage({ params }: PostDetailsPageProps) {
  const { id } = await params;
  return <PostDetailsClient postId={id} />;
}
