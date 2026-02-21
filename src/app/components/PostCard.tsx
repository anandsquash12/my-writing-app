"use client";

import Link from "next/link";
import { PostRecord } from "../lib/posts";
import LikeButton from "./LikeButton";

interface PostCardProps {
  post: PostRecord;
  excerpt?: boolean;
}

function formatDate(value: number): string {
  if (!value) {
    return "Unknown date";
  }
  return new Date(value).toLocaleString();
}

function withExcerpt(content: string): string {
  if (content.length <= 180) {
    return content;
  }
  return `${content.slice(0, 180)}...`;
}

export default function PostCard({ post, excerpt = false }: PostCardProps) {
  return (
    <article className="post-card">
      <div className="post-card-top">
        <h2 className="post-title">
          <Link href={`/posts/${post.id}`}>{post.title}</Link>
        </h2>
        <p className="post-meta">
          By{" "}
          {post.authorId ? (
            <Link href={`/writers/${post.authorId}`} className="inline-link">
              {post.authorName}
            </Link>
          ) : (
            post.authorName
          )}
          {" · "}
          <span>{formatDate(post.createdAt)}</span>
        </p>
      </div>

      <p className="post-content">{excerpt ? withExcerpt(post.content) : post.content}</p>

      <div className="post-actions">
        <LikeButton postId={post.id} likeCount={post.likeCount} />
        <Link href={`/posts/${post.id}`} className="outline-link">
          View details
        </Link>
      </div>
    </article>
  );
}

