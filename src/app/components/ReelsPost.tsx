"use client";

import { motion } from "framer-motion";
import NotificationBell, { NotificationItem } from "./NotificationBell";

export interface ReelsFeedItem {
  id: string;
  source: "post" | "quote";
  title: string;
  content: string;
  authorName: string;
  authorId: string;
  tags: string[];
  likeCount: number;
  commentCount: number;
  viewCount: number;
  score: number;
  imageURL: string;
  createdAt: number;
}

interface ReelsPostProps {
  item: ReelsFeedItem;
  isFollowing: boolean;
  notifications: NotificationItem[];
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onFollow: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const gradients = [
  "linear-gradient(120deg, #1e1e2e 0%, #09090f 100%)",
  "linear-gradient(120deg, #120f20 0%, #1a242f 100%)",
  "linear-gradient(120deg, #0a0a0f 0%, #101022 100%)",
  "linear-gradient(120deg, #04040a 0%, #0e0915 100%)",
];

function getBackgroundStyle(imageURL: string) {
  if (imageURL) {
    return {
      backgroundImage: `url(${imageURL})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    } as const;
  }

  const gradient = gradients[Math.abs(hashCode(imageURL)) % gradients.length];
  return {
    background: gradient,
  } as const;
}

function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < (str?.length || 0); i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export default function ReelsPost({
  item,
  isFollowing,
  notifications,
  onLike,
  onComment,
  onShare,
  onFollow,
  onNext,
  onPrev,
}: ReelsPostProps) {
  return (
    <motion.section
      className="relative flex h-screen w-full flex-col overflow-hidden text-white"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.35 }}
      style={getBackgroundStyle(item.imageURL)}
    >
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold tracking-wider">ReelsPod</div>
          <NotificationBell items={notifications} />
        </div>

        <div className="relative flex grow items-center justify-center px-4 text-center">
          <motion.p
            className="whitespace-pre-wrap text-3xl font-black leading-tight md:text-5xl"
            key={item.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {item.content || item.title || "Your silence hurts more than your words 💔"}
          </motion.p>
        </div>

        <div className="space-y-3 text-white">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">@{item.authorName || "anonymous"}</p>
            <button
              type="button"
              onClick={onFollow}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                isFollowing ? "bg-white text-black" : "bg-white/20 text-white"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          </div>

          <p className="text-sm text-gray-200">{item.title || "Deep feeling, written from the heart."}</p>
          <div className="flex flex-wrap gap-2 text-xs text-gray-300">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-md bg-white/10 px-2 py-1">
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-200">
            <span>❤️ {item.likeCount}</span>
            <span>💬 {item.commentCount}</span>
            <span>👁 {item.viewCount}</span>
            <span>⭐ {item.score}</span>
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-1/3 flex translate-y-[-50%] flex-col items-center gap-3">
        <motion.button
          type="button"
          onClick={onLike}
          className="rounded-full bg-white/20 p-3 text-lg transition hover:bg-white/35"
          whileTap={{ scale: 0.9 }}
        >
          ❤️
        </motion.button>
        <motion.button
          type="button"
          onClick={onComment}
          className="rounded-full bg-white/20 p-3 text-lg transition hover:bg-white/35"
          whileTap={{ scale: 0.9 }}
        >
          💬
        </motion.button>
        <motion.button
          type="button"
          onClick={onShare}
          className="rounded-full bg-white/20 p-3 text-lg transition hover:bg-white/35"
          whileTap={{ scale: 0.9 }}
        >
          🔁
        </motion.button>
        <motion.button
          type="button"
          onClick={onFollow}
          className="rounded-full bg-white/20 p-3 text-lg transition hover:bg-white/35"
          whileTap={{ scale: 0.9 }}
        >
          ➕
        </motion.button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-between px-6 text-white/90">
        <button type="button" onClick={onPrev} className="pointer-events-auto rounded-full bg-black/50 px-3 py-1 text-xs">
          ▲ Prev
        </button>
        <button type="button" onClick={onNext} className="pointer-events-auto rounded-full bg-black/50 px-3 py-1 text-xs">
          ▼ Next
        </button>
      </div>
    </motion.section>
  );
}
