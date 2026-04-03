import type { Metadata } from "next";
import PostDetailsClient from "./PostDetailsClient";
import { buildCanonical, fetchPostForMetadata, toMetaDescription } from "../../lib/seo";

interface PostDetailsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PostDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  const postId = decodeURIComponent(id || "");
  const post = await fetchPostForMetadata(postId);
  // Use /quotes as canonical URL (unified data source)
  const canonical = buildCanonical(`/quotes/${encodeURIComponent(postId)}`);

  if (!post) {
    return {
      title: "Post not found",
      description: "This post is not available.",
      alternates: {
        canonical,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const isIndexable = post.visibility === "public" && post.status === "published";
  const description = toMetaDescription(post.content, 160) || `Read ${post.title} on Shayari Hub.`;

  return {
    title: post.title,
    description,
    alternates: {
      canonical,
    },
    robots: isIndexable
      ? {
          index: true,
          follow: true,
        }
      : {
          index: false,
          follow: false,
        },
    openGraph: {
      title: post.title,
      description,
      url: canonical,
      type: "article",
    },
  };
}

export default async function PostDetailsPage({ params }: PostDetailsPageProps) {
  const { id } = await params;
  return <PostDetailsClient postId={id} />;
}
