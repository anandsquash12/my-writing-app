"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onValue, push, ref, runTransaction } from "firebase/database";
import { db } from "../firebase/config";
import { normalizePost, type PostRecord } from "../lib/posts";
import { normalizeQuote, type QuoteRecord } from "../lib/quotes";
import ReelsPost, { ReelsFeedItem } from "./ReelsPost";
import CommentModal from "./CommentModal";
import NotificationBell, { NotificationItem } from "./NotificationBell";

interface CommentEntry {
  id: string;
  userName: string;
  text: string;
  createdAt: number;
}

export default function ReelsFeed() {
  const [items, setItems] = useState<ReelsFeedItem[]>([]);
  const [comments, setComments] = useState<Record<string, number>>({});
  const [commentRows, setCommentRows] = useState<CommentEntry[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [followMap, setFollowMap] = useState<Record<string, boolean>>({});
  const [isCommentOpen, setCommentOpen] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const viewedSet = useRef<Set<string>>(new Set());
  const touchStartY = useRef<number | null>(null);

  const mergedItems = useMemo(() => {
    const withMeta = items.map((item) => {
      const commentCount = comments[item.id] ?? item.commentCount;
      const score = item.likeCount * 3 + commentCount * 4 + item.viewCount * 1;
      return { ...item, commentCount, score };
    });

    const sorted = [...withMeta].sort((a, b) => b.score - a.score);
    return sorted;
  }, [items, comments]);

  useEffect(() => {
    if (mergedItems.length > 0 && currentIdx >= mergedItems.length) {
      setCurrentIdx(0);
    }
  }, [mergedItems.length, currentIdx]);

  useEffect(() => {
    const postsRef = ref(db, "posts");
    const quotesRef = ref(db, "quotes");

    const unsubscribePosts = onValue(postsRef, (snapshot) => {
      const value = snapshot.val() || {};
      const postItems: ReelsFeedItem[] = Object.entries(value).reduce<ReelsFeedItem[]>((acc, [id, raw]) => {
        const post = normalizePost(id, raw);
        if (post.visibility !== "public" || post.status !== "published") return acc;
        acc.push({
          id,
          source: "post",
          title: post.title,
          content: post.content,
          authorName: post.authorName || "Anonymous",
          authorId: post.authorId || "",
          tags: post.tags || [],
          likeCount: post.likeCount || 0,
          commentCount: 0,
          viewCount: post.viewCount || 0,
          score: 0,
          imageURL: "",
          createdAt: post.createdAt || 0,
        });
        return acc;
      }, []);

      setItems((prev) => {
        const existingQuotes = prev.filter((i) => i.source === "quote");
        return [...postItems, ...existingQuotes];
      });
      setLoading(false);
    });

    const unsubscribeQuotes = onValue(quotesRef, (snapshot) => {
      const value = snapshot.val() || {};
      const quoteItems: ReelsFeedItem[] = Object.entries(value).reduce<ReelsFeedItem[]>((acc, [id, raw]) => {
        const quote = normalizeQuote(id, raw);
        if (quote.visibility !== "public") return acc;

        const text = quote.textContent?.map((x) => x.text).join(" ") || "Your silence hurts more than your words 💔";

        acc.push({
          id,
          source: "quote",
          title: "",
          content: text,
          authorName: quote.authorName || "Anonymous",
          authorId: quote.authorId || "",
          tags: [],
          likeCount: quote.likeCount || 0,
          commentCount: 0,
          viewCount: 0,
          score: 0,
          imageURL: quote.imageURL || "",
          createdAt: quote.createdAt || 0,
        });
        return acc;
      }, []);

      setItems((prev) => {
        const existingPosts = prev.filter((i) => i.source === "post");
        return [...existingPosts, ...quoteItems];
      });
      setLoading(false);
    });

    const commentsRef = ref(db, "comments");
    const unsubscribeComments = onValue(commentsRef, (snapshot) => {
      const value = snapshot.val() || {};
      const computed: Record<string, number> = {};
      Object.entries(value).forEach(([postId, postComments]) => {
        computed[postId] = postComments ? Object.keys(postComments as Record<string, unknown>).length : 0;
      });
      setComments(computed);
    });

    return () => {
      unsubscribePosts();
      unsubscribeQuotes();
      unsubscribeComments();
    };
  }, []);

  const activeItem = mergedItems[currentIdx];

  useEffect(() => {
    if (!activeItem) return;
    setCommentRows([]);

    const commentsRef = ref(db, `comments/${activeItem.id}`);
    const unsubscribe = onValue(commentsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const rows: CommentEntry[] = Object.entries(data).map(([id, record]) => {
        const src = (record as any) || {};
        return {
          id,
          userName: src.userName || "Anonymous",
          text: src.text || "",
          createdAt: src.createdAt || Date.now(),
        };
      });
      setCommentRows(rows);
    });

    return () => unsubscribe();
  }, [activeItem?.id]);

  useEffect(() => {
    if (!activeItem) return;
    if (viewedSet.current.has(activeItem.id)) return;
    viewedSet.current.add(activeItem.id);

    const path = activeItem.source === "post" ? `posts/${activeItem.id}/viewCount` : `quotes/${activeItem.id}/viewCount`;

    runTransaction(ref(db, path), (cur) => {
      if (typeof cur === "number") return cur + 1;
      return 1;
    }).catch(() => {
      // no-op
    });

    setItems((prev) =>
      prev.map((item) =>
        item.id === activeItem.id
          ? { ...item, viewCount: (item.viewCount || 0) + 1 }
          : item,
      ),
    );
  }, [activeItem]);

  useEffect(() => {
    if (!mergedItems || mergedItems.length === 0) return;

    const next = mergedItems[(currentIdx + 1) % mergedItems.length];
    if (next?.imageURL) {
      const img = new Image();
      img.src = next.imageURL;
    }
  }, [currentIdx, mergedItems]);

  const moveNext = useCallback(() => {
    if (!mergedItems.length) return;
    setCurrentIdx((prev) => (prev + 1) % mergedItems.length);
  }, [mergedItems.length]);

  const movePrev = useCallback(() => {
    if (!mergedItems.length) return;
    setCurrentIdx((prev) => (prev + mergedItems.length - 1) % mergedItems.length);
  }, [mergedItems.length]);

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = (event.changedTouches[0]?.clientY ?? 0) - touchStartY.current;
    if (delta < -30) {
      moveNext();
    }
    if (delta > 30) {
      movePrev();
    }
    touchStartY.current = null;
  };

  const handleWheel = (event: React.WheelEvent) => {
    if (Math.abs(event.deltaY) < 20) return;
    if (event.deltaY > 0) {
      moveNext();
    } else {
      movePrev();
    }
  };

  const handleLike = async () => {
    if (!activeItem) return;

    const path = activeItem.source === "post" ? `posts/${activeItem.id}/likeCount` : `quotes/${activeItem.id}/likeCount`;
    await runTransaction(ref(db, path), (cur) => {
      if (typeof cur === "number") return cur + 1;
      return 1;
    });

    setItems((prev) =>
      prev.map((it) => (it.id === activeItem.id ? { ...it, likeCount: it.likeCount + 1 } : it)),
    );
  };

  const handleShare = async () => {
    if (!activeItem) return;
    try {
      const shareUrl = `${window.location.origin}/${activeItem.source}s/${activeItem.id}`;
      await navigator.clipboard.writeText(shareUrl);
      setNotifs((cur) => [
        { id: `${Date.now()}`, title: "Link copied", subtitle: "Share your post with friends", createdAt: Date.now(), read: false },
        ...cur,
      ]);
    } catch {
      // ignore
    }
  };

  const handleFollow = () => {
    if (!activeItem) return;
    setFollowMap((prev) => ({ ...prev, [activeItem.authorId]: !prev[activeItem.authorId] }));
  };

  const handleCommentSend = async (comment: string) => {
    if (!activeItem) return;
    const postCommentsRef = ref(db, `comments/${activeItem.id}`);
    await push(postCommentsRef, {
      text: comment,
      userName: "You",
      userId: "anonymous",
      createdAt: Date.now(),
    });
  };

  const activeFollowing = activeItem ? !!followMap[activeItem.authorId] : false;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <p>Loading Reels...</p>
      </div>
    );
  }

  if (!activeItem) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <p>No Reels available yet.</p>
      </div>
    );
  }

  return (
    <div
      className="relative h-screen w-full overflow-hidden bg-black text-white"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <AnimatePresence mode="wait">
        <motion.div key={activeItem.id} className="h-full w-full">
          <ReelsPost
            item={activeItem}
            isFollowing={activeFollowing}
            notifications={notifs}
            onLike={handleLike}
            onComment={() => setCommentOpen(true)}
            onShare={handleShare}
            onFollow={handleFollow}
            onNext={moveNext}
            onPrev={movePrev}
          />
        </motion.div>
      </AnimatePresence>

      <CommentModal
        isOpen={isCommentOpen}
        onClose={() => setCommentOpen(false)}
        comments={commentRows}
        authorName={activeItem.authorName}
        onSubmit={handleCommentSend}
      />
    </div>
  );
}
