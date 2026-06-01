"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Metadata } from "next";

const samplePosts = [
  {
    id: "t1",
    author: "Rohan Das",
    initials: "RD",
    avatarBg: "bg-[#fde8e8]",
    avatarText: "text-[#8a1a1a]",
    genre: "Lyrics",
    title: "Tere Bin (Song)",
    excerpt: "An aching melody for the moments we carry the most, a song that hums in empty rooms.",
    likes: 891,
    comments: 72,
    premium: true,
  },
  {
    id: "t2",
    author: "Arjun Mehta",
    initials: "AM",
    avatarBg: "bg-[#e8f4f0]",
    avatarText: "text-[#1a6b52]",
    genre: "Ghazal",
    title: "Dil ka Dariya",
    excerpt: "A river of hushed yearning and whispered vows beneath a moonlit sky.",
    likes: 518,
    comments: 47,
    premium: true,
  },
  {
    id: "t3",
    author: "Priya Kaur",
    initials: "PK",
    avatarBg: "bg-[#fdf3e3]",
    avatarText: "text-[#8a5a0a]",
    genre: "Shayari",
    title: "Raat ke Andheron Mein",
    excerpt: "When night folds around the heart, every memory becomes a quiet poem.",
    likes: 342,
    comments: 28,
    premium: false,
  },
  {
    id: "t4",
    author: "Kabir Singh",
    initials: "KS",
    avatarBg: "bg-[#fdecea]",
    avatarText: "text-[#8a4020]",
    genre: "Dohe",
    title: "Samay ke Dohe",
    excerpt: "Two lines of truth that leave the mind still and the soul listening.",
    likes: 423,
    comments: 38,
    premium: false,
  },
  {
    id: "t5",
    author: "Neha Sharma",
    initials: "NS",
    avatarBg: "bg-[#e8f0fd]",
    avatarText: "text-[#1a3a8a]",
    genre: "Flash Fiction",
    title: "Woh Ek Roz",
    excerpt: "A single day rewoven into a story of sudden connection and quiet endings.",
    likes: 167,
    comments: 31,
    premium: false,
  },
  {
    id: "t6",
    author: "Simran Gill",
    initials: "SG",
    avatarBg: "bg-[#f0eaf8]",
    avatarText: "text-[#5a3a8a]",
    genre: "Kavita",
    title: "Mitti ki Khushbu",
    excerpt: "The earth remembers every footstep, every promise spoken in the rain.",
    likes: 205,
    comments: 19,
    premium: false,
  },
];

const filters = [
  { label: "All Time", key: "all-time" },
  { label: "This Week", key: "this-week" },
  { label: "Today", key: "today" },
  { label: "Poetry", key: "poetry" },
  { label: "Lyrics", key: "lyrics" },
  { label: "Stories", key: "stories" },
] as const;

export default function TrendingPage() {
  const [activeFilter, setActiveFilter] = useState<typeof filters[number]["key"]>("all-time");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(
    samplePosts.reduce((acc, item) => ({ ...acc, [item.id]: item.likes }), {}),
  );

  const filteredPosts = useMemo(() => {
    if (activeFilter === "poetry") {
      return samplePosts.filter((item) => item.genre.toLowerCase().includes("poetry") || item.genre.toLowerCase().includes("shayari") || item.genre.toLowerCase().includes("kavita"));
    }
    if (activeFilter === "lyrics") {
      return samplePosts.filter((item) => item.genre.toLowerCase().includes("lyrics"));
    }
    if (activeFilter === "stories") {
      return samplePosts.filter((item) => item.genre.toLowerCase().includes("story") || item.genre.toLowerCase().includes("fiction"));
    }
    return samplePosts;
  }, [activeFilter]);

  const sortedPosts = useMemo(
    () => [...filteredPosts].sort((a, b) => likeCounts[b.id] - likeCounts[a.id]),
    [filteredPosts, likeCounts],
  );

  const toggleLike = (id: string) => {
    setLiked((current) => ({ ...current, [id]: !current[id] }));
    setLikeCounts((current) => ({
      ...current,
      [id]: current[id] + (liked[id] ? -1 : 1),
    }));
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-[#d9c9b1] bg-[#faf7f2] p-8 text-[#1a1209] shadow-xl">
        <div className="space-y-4">
          <p className="hero-tag" style={{ color: "#8a5a0a" }}>
            Trending on ShabadLok
          </p>
          <h1 className="serif-display text-5xl font-semibold">🔥 Trending on ShabadLok</h1>
          <p className="max-w-3xl text-lg leading-8 text-[#6b5e4a]">
            Explore the six most engaging pieces that readers are loving right now. Premium stories, lyrical gems, and poetry with the biggest buzz.
          </p>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#e7dccd] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeFilter === filter.key ? "bg-[#8a5a0a] text-white" : "bg-[#f3ede2] text-[#1a1209]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        {sortedPosts.map((post, index) => (
          <article key={post.id} className="rounded-[28px] border border-[#e7dccd] bg-[#faf7f2] p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-center gap-4">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                  index < 3 ? "bg-[#f5e8c8] text-[#8a5a0a]" : "bg-[#f3ede2] text-[#6b5e4a]"
                }`}>
                  {index + 1}
                </span>
                <div className="flex items-center gap-3">
                  <div className={`avatar avatar-large flex h-12 w-12 items-center justify-center rounded-full ${post.avatarBg} ${post.avatarText} font-semibold`}>
                    {post.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1a1209]">{post.author}</p>
                    <p className="text-sm text-[#6b5e4a]">{post.genre}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#fff1d6] px-3 py-1 text-sm font-semibold text-[#8a5a0a]">
                  {post.premium ? "⭐ Premium" : "Free"}
                </span>
              </div>
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-[#1a1209]">{post.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6b5e4a] line-clamp-2">{post.excerpt}</p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-[#6b5e4a]">
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => toggleLike(post.id)} className="like-button">
                  {liked[post.id] ? "♥" : "♡"} {likeCounts[post.id]}
                </button>
                <span>{post.comments} comments</span>
              </div>
              {post.premium ? (
                <span className="rounded-full bg-[#f5e8c8] px-4 py-2 text-sm font-semibold text-[#8a5a0a]">Premium</span>
              ) : (
                <Link href="/login" className="inline-flex rounded-full border border-[#d9c9b1] bg-[#ffffff] px-4 py-2 text-sm font-semibold text-[#1a1209] hover:border-[#c9851a]">
                  Read →
                </Link>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
