"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../firebase/config";
import InstagramPostCard from "./InstagramPostCard";
import PostCard from "./PostCard";
import { normalizePost, type PostRecord } from "../lib/posts";
import { normalizeQuote, type QuoteRecord } from "../lib/quotes";

interface TrendingFeedClientProps {
  limit?: number;
  showViewAllLink?: boolean;
}

type CommentsMap = Record<string, Record<string, unknown> | null>;
type TrendItem =
  | { kind: "post"; id: string; createdAt: number; likeCount: number; viewCount: number; data: PostRecord }
  | { kind: "quote"; id: string; createdAt: number; likeCount: number; viewCount: number; data: QuoteRecord };

function getTrendingScore(item: TrendItem, commentCount: number): number {
  const baseScore = item.likeCount * 4 + commentCount * 6 + item.viewCount * 1.5;
  const ageMs = Date.now() - item.createdAt;
  const ageHours = ageMs / (1000 * 60 * 60);

  if (ageHours < 24) {
    return baseScore * 1.35;
  }
  if (ageHours < 48) {
    return baseScore * 1.2;
  }
  return baseScore;
}

export default function TrendingFeedClient({ limit, showViewAllLink = false }: TrendingFeedClientProps) {
  const [items, setItems] = useState<TrendItem[]>([]);
  const [commentsMap, setCommentsMap] = useState<CommentsMap>({});

  useEffect(() => {
    let quotesData: Record<string, unknown> | null = null;
    let postsData: Record<string, unknown> | null = null;

    const syncItems = () => {
      const nextItems: TrendItem[] = [];

      for (const [id, value] of Object.entries(postsData || {})) {
        const post = normalizePost(id, value);
        if (post.visibility === "public" && post.status === "published") {
          nextItems.push({
            kind: "post",
            id,
            createdAt: post.createdAt,
            likeCount: post.likeCount,
            viewCount: post.viewCount,
            data: post,
          });
        }
      }

      for (const [id, value] of Object.entries(quotesData || {})) {
        const source = (value || {}) as Record<string, unknown>;
        const hasImage = typeof source.imageURL === "string" && source.imageURL.trim().length > 0;

        if (hasImage) {
          const quote = normalizeQuote(id, value);
          if (quote.visibility === "public") {
            nextItems.push({
              kind: "quote",
              id,
              createdAt: quote.createdAt,
              likeCount: quote.likeCount,
              viewCount: 0,
              data: quote,
            });
          }
        } else {
          const post = normalizePost(id, value);
          if (post.visibility === "public" && post.status === "published") {
            nextItems.push({
              kind: "post",
              id,
              createdAt: post.createdAt,
              likeCount: post.likeCount,
              viewCount: post.viewCount,
              data: post,
            });
          }
        }
      }

      setItems(nextItems);
    };

    const stopQuotes = onValue(ref(db, "quotes"), (snapshot) => {
      quotesData = (snapshot.val() || {}) as Record<string, unknown>;
      syncItems();
    });

    const stopPosts = onValue(ref(db, "posts"), (snapshot) => {
      postsData = (snapshot.val() || {}) as Record<string, unknown>;
      syncItems();
    });

    return () => {
      stopQuotes();
      stopPosts();
    };
  }, []);

  useEffect(() => {
    const commentsRef = ref(db, "comments");
    const unsubscribe = onValue(commentsRef, (snapshot) => {
      const data = (snapshot.val() || {}) as CommentsMap;
      setCommentsMap(data);
    });
    return () => unsubscribe();
  }, []);

  const trendingItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const aCommentCount = Object.keys(commentsMap[a.id] || {}).length;
      const bCommentCount = Object.keys(commentsMap[b.id] || {}).length;
      return getTrendingScore(b, bCommentCount) - getTrendingScore(a, aCommentCount);
    });
    return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
  }, [commentsMap, items, limit]);

  if (trendingItems.length === 0) {
    return <div className="card">No trending posts yet.</div>;
  }

  return (
    <div className="stack">
      <section className="post-list">
        {trendingItems.map((item, index) =>
          item.kind === "quote" ? (
            <InstagramPostCard key={`quote-${item.id}-${index}`} post={item.data} />
          ) : (
            <PostCard key={`post-${item.id}-${index}`} post={item.data} excerpt />
          ),
        )}
      </section>
      {showViewAllLink ? (
        <Link href="/trending" className="inline-link">
          View all trending posts
        </Link>
      ) : null}
    </div>
  );
}
