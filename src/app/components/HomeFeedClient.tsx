"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import InstagramPostCard from "./InstagramPostCard";
import PostCard from "./PostCard";
import { db } from "../firebase/config";
import { normalizePost, type PostRecord } from "../lib/posts";
import { normalizeQuote, type QuoteRecord } from "../lib/quotes";
import { FeedSkeleton } from "./ui/Loading";

type FeedItem =
  | { kind: "post"; id: string; createdAt: number; data: PostRecord }
  | { kind: "quote"; id: string; createdAt: number; data: QuoteRecord };

export default function HomeFeedClient() {
  const [quotesData, setQuotesData] = useState<Record<string, unknown>>({});
  const [postsData, setPostsData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);

  useEffect(() => {
    let quotesLoaded = false;
    let postsLoaded = false;
    const markReady = (source: "quotes" | "posts") => {
      if (source === "quotes") {
        quotesLoaded = true;
      } else {
        postsLoaded = true;
      }

      if (quotesLoaded && postsLoaded) {
        setLoading(false);
      }
    };

    const stopQuotes = onValue(ref(db, "quotes"), (snapshot) => {
      setQuotesData((snapshot.val() || {}) as Record<string, unknown>);
      markReady("quotes");
    }, (error) => {
      console.error("Failed to load quotes feed:", error);
      setLoadErrors((current) => (current.includes("quotes") ? current : [...current, "quotes"]));
      setQuotesData({});
      markReady("quotes");
    });

    const stopPosts = onValue(ref(db, "posts"), (snapshot) => {
      setPostsData((snapshot.val() || {}) as Record<string, unknown>);
      markReady("posts");
    }, (error) => {
      console.error("Failed to load posts feed:", error);
      setLoadErrors((current) => (current.includes("posts") ? current : [...current, "posts"]));
      setPostsData({});
      markReady("posts");
    });

    const timeoutId = window.setTimeout(() => {
      setLoading(false);
    }, 8000);

    return () => {
      stopQuotes();
      stopPosts();
      window.clearTimeout(timeoutId);
    };
  }, []);

  const items = useMemo(() => {
    const nextItems: FeedItem[] = [];

    for (const [id, value] of Object.entries(postsData)) {
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

    for (const [id, value] of Object.entries(quotesData)) {
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

    return nextItems.sort((a, b) => b.createdAt - a.createdAt);
  }, [postsData, quotesData]);

  return (
    <div className="space-y-6">
      {loading ? <FeedSkeleton /> : null}
      {!loading && loadErrors.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Some feed data could not be loaded ({loadErrors.join(", ")}). Check Firebase rules and environment variables.
        </div>
      ) : null}
      {!loading && items.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">No posts yet.</div>
      ) : null}
      {!loading ? (
        items.map((item, index) =>
          item.kind === "quote" ? (
            <InstagramPostCard key={`quote-${index}-${item.id}`} post={item.data} />
          ) : (
            <PostCard key={`post-${index}-${item.id}`} post={item.data} excerpt />
          ),
        )
      ) : null}
    </div>
  );
}
