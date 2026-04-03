"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "../firebase/config";
import InstagramPostCard from "../components/InstagramPostCard";
import PostCard from "../components/PostCard";
import { normalizePost, type PostRecord } from "../lib/posts";
import { normalizeQuote, type QuoteRecord } from "../lib/quotes";

type ExploreItem =
  | { kind: "post"; id: string; createdAt: number; data: PostRecord }
  | { kind: "quote"; id: string; createdAt: number; data: QuoteRecord };

export default function QuotesFeedClient() {
  const [items, setItems] = useState<ExploreItem[]>([]);

  useEffect(() => {
    let quotesData: Record<string, unknown> | null = null;
    let postsData: Record<string, unknown> | null = null;

    const syncItems = () => {
      const nextItems: ExploreItem[] = [];

      for (const [id, value] of Object.entries(postsData || {})) {
        const post = normalizePost(id, value);
        if (post.visibility === "public" && post.status === "published") {
          nextItems.push({
            kind: "post",
            id,
            createdAt: post.createdAt,
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
              data: post,
            });
          }
        }
      }

      nextItems.sort((a, b) => b.createdAt - a.createdAt);
      setItems(nextItems);
    };

    const stopQuotes = onValue(ref(database, "quotes"), (snapshot) => {
      quotesData = (snapshot.val() || {}) as Record<string, unknown>;
      syncItems();
    });

    const stopPosts = onValue(ref(database, "posts"), (snapshot) => {
      postsData = (snapshot.val() || {}) as Record<string, unknown>;
      syncItems();
    });

    return () => {
      stopQuotes();
      stopPosts();
    };
  }, []);

  if (items.length === 0) {
    return <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">No public posts yet.</div>;
  }

  return (
    <div className="space-y-6">
      {items.map((item) =>
        item.kind === "quote" ? (
          <InstagramPostCard key={`quote-${item.id}`} post={item.data} />
        ) : (
          <PostCard key={`post-${item.id}`} post={item.data} excerpt />
        ),
      )}
    </div>
  );
}
