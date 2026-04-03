"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../firebase/config";
import InstagramPostCard from "../components/InstagramPostCard";
import PostCard from "../components/PostCard";
import { normalizePost, type PostRecord } from "../lib/posts";
import { normalizeQuote, type QuoteRecord } from "../lib/quotes";
import { FeedSkeleton } from "../components/ui/Loading";

type CommentsMap = Record<string, Record<string, unknown> | null>;
type ExploreItem =
  | { kind: "post"; id: string; createdAt: number; likeCount: number; commentCount: number; score: number; data: PostRecord }
  | { kind: "quote"; id: string; createdAt: number; likeCount: number; commentCount: number; score: number; data: QuoteRecord };

export default function ExplorePage() {
  const [quoteData, setQuoteData] = useState<Record<string, unknown>>({});
  const [commentsMap, setCommentsMap] = useState<CommentsMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let quotesLoaded = false;
    let commentsLoaded = false;
    const markReady = (source: "quotes" | "comments") => {
      if (source === "quotes") {
        quotesLoaded = true;
      } else {
        commentsLoaded = true;
      }

      if (quotesLoaded && commentsLoaded) {
        setLoading(false);
      }
    };

    const stopQuotes = onValue(ref(db, "quotes"), (snapshot) => {
      setQuoteData((snapshot.val() || {}) as Record<string, unknown>);
      markReady("quotes");
    });

    const stopComments = onValue(ref(db, "comments"), (snapshot) => {
      setCommentsMap((snapshot.val() || {}) as CommentsMap);
      markReady("comments");
    });

    return () => {
      stopQuotes();
      stopComments();
    };
  }, []);

  const items = useMemo(() => {
    const nextItems: ExploreItem[] = [];

    for (const [id, value] of Object.entries(quoteData)) {
      const source = (value || {}) as Record<string, unknown>;
      const commentCount = Object.keys(commentsMap[id] || {}).length;
      const hasImage = typeof source.imageURL === "string" && source.imageURL.trim().length > 0;

      if (hasImage) {
        const quote = normalizeQuote(id, value);
        if (quote.visibility !== "public") {
          continue;
        }

        nextItems.push({
          kind: "quote",
          id,
          createdAt: quote.createdAt,
          likeCount: quote.likeCount,
          commentCount,
          score: quote.likeCount * 2 + commentCount * 3,
          data: quote,
        });
      } else {
        const post = normalizePost(id, value);
        if (post.visibility !== "public" || post.status !== "published") {
          continue;
        }

        nextItems.push({
          kind: "post",
          id,
          createdAt: post.createdAt,
          likeCount: post.likeCount,
          commentCount,
          score: post.likeCount * 2 + commentCount * 3,
          data: post,
        });
      }
    }

    return nextItems.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.likeCount !== a.likeCount) {
        return b.likeCount - a.likeCount;
      }
      if (b.commentCount !== a.commentCount) {
        return b.commentCount - a.commentCount;
      }
      return b.createdAt - a.createdAt;
    });
  }, [commentsMap, quoteData]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-neutral-900">Explore</h1>
        <p className="mt-2 text-sm text-neutral-600">Discover the highest ranked public posts based on likes and comments.</p>
      </section>

      {loading ? <FeedSkeleton /> : null}
      {!loading && items.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">No posts found.</div>
      ) : null}
      {!loading ? (
        <section className="space-y-6">
          {items.map((item) =>
            item.kind === "quote" ? (
              <InstagramPostCard key={`quote-${item.id}`} post={item.data} />
            ) : (
              <PostCard key={`post-${item.id}`} post={item.data} excerpt />
            ),
          )}
        </section>
      ) : null}
    </div>
  );
}
