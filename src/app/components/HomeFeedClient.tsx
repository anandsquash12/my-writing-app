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
  | { kind: "post"; id: string; createdAt: number; score: number; data: PostRecord }
  | { kind: "quote"; id: string; createdAt: number; score: number; data: QuoteRecord };

export default function HomeFeedClient() {
  const [quotesData, setQuotesData] = useState<Record<string, unknown>>({});
  const [postsData, setPostsData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"latest" | "trending">("latest");

  useEffect(() => {
    if (!db) {
      setLoadErrors(["firebase"]);
      setLoading(false);
      return;
    }

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

    const stopQuotes = onValue(
      ref(db, "quotes"),
      (snapshot) => {
        setQuotesData((snapshot.val() || {}) as Record<string, unknown>);
        markReady("quotes");
      },
      () => {
        setLoadErrors((current) => (current.includes("quotes") ? current : [...current, "quotes"]));
        setQuotesData({});
        markReady("quotes");
      },
    );

    const stopPosts = onValue(
      ref(db, "posts"),
      (snapshot) => {
        setPostsData((snapshot.val() || {}) as Record<string, unknown>);
        markReady("posts");
      },
      () => {
        setLoadErrors((current) => (current.includes("posts") ? current : [...current, "posts"]));
        setPostsData({});
        markReady("posts");
      },
    );

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
    const addedIds = new Set<string>();

    for (const [id, value] of Object.entries(postsData)) {
      const post = normalizePost(id, value);
      if (post.visibility === "public" && post.status === "published") {
        nextItems.push({
          kind: "post",
          id,
          createdAt: post.createdAt,
          score: post.likeCount,
          data: post,
        });
        addedIds.add(id);
      }
    }

    for (const [id, value] of Object.entries(quotesData)) {
      // Skip if already added from postsData
      if (addedIds.has(id)) {
        continue;
      }

      const source = (value || {}) as Record<string, unknown>;
      const hasImage = typeof source.imageURL === "string" && source.imageURL.trim().length > 0;

      if (hasImage) {
        const quote = normalizeQuote(id, value);
        if (quote.visibility === "public") {
          nextItems.push({
            kind: "quote",
            id,
            createdAt: quote.createdAt,
            score: quote.likeCount,
            data: quote,
          });
          addedIds.add(id);
        }
      } else {
        const post = normalizePost(id, value);
        if (post.visibility === "public" && post.status === "published") {
          nextItems.push({
            kind: "post",
            id,
            createdAt: post.createdAt,
            score: post.likeCount,
            data: post,
          });
          addedIds.add(id);
        }
      }
    }

    return nextItems;
  }, [postsData, quotesData]);

  const latestItems = useMemo(() => [...items].sort((a, b) => b.createdAt - a.createdAt), [items]);
  const trendingItems = useMemo(
    () => [...items].sort((a, b) => (b.score === a.score ? b.createdAt - a.createdAt : b.score - a.score)),
    [items],
  );

  const activeItems = activeTab === "latest" ? latestItems : trendingItems;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-[#121218]/90 p-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("latest")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === "latest" ? "bg-[#f0c18d] text-[#140f0b]" : "bg-white/5 text-[#e8dfcf]"
            }`}
          >
            Latest
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("trending")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === "trending" ? "bg-[#f0c18d] text-[#140f0b]" : "bg-white/5 text-[#e8dfcf]"
            }`}
          >
            Trending
          </button>
        </div>
        <p className="px-2 text-sm text-[#a89f90]">
          {activeTab === "latest" ? "Newest writing, sorted by publish time." : "Most liked writing, sorted by audience response."}
        </p>
      </div>

      {loading ? <FeedSkeleton /> : null}

      {!loading && loadErrors.length > 0 ? (
        <div className="rounded-[28px] border border-[#d6a56f]/30 bg-[#d6a56f]/10 p-5 text-sm text-[#efd7b5]">
          Some feed data could not be loaded ({loadErrors.join(", ")}). The screen stays usable, but double-check Firebase rules and env vars.
        </div>
      ) : null}

      {!loading && activeItems.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-white/10 bg-[#121218]/90 p-8 text-center">
          <p className="serif-display text-3xl text-[#f3ebdb]">No posts yet</p>
          <p className="mt-2 text-sm text-[#a89f90]">Start writing your first piece and give readers something worth returning for.</p>
        </div>
      ) : null}

      {!loading
        ? activeItems.map((item) =>
            item.kind === "quote" ? (
              <InstagramPostCard key={`quote-${item.id}`} post={item.data} />
            ) : (
              <PostCard key={`post-${item.id}`} post={item.data} excerpt />
            ),
          )
        : null}
    </div>
  );
}
