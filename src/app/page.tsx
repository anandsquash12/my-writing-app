"use client";

import type { Metadata } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";

const samplePosts = [
  {
    id: "post-1",
    title: "Raat ke Andheron Mein",
    author: "Priya Kaur",
    initials: "PK",
    avatarBg: "bg-[#fdf3e3]",
    avatarText: "text-[#8a5a0a]",
    genre: "Shayari",
    excerpt: "A night inked in longing, where silence whispers and memories gather like rain.",
    likes: 342,
    comments: 28,
    time: "2h ago",
    premium: false,
  },
  {
    id: "post-2",
    title: "Dil ka Dariya",
    author: "Arjun Mehta",
    initials: "AM",
    avatarBg: "bg-[#e8f4f0]",
    avatarText: "text-[#1a6b52]",
    genre: "Ghazal",
    excerpt: "A gilded river of feeling, overflowing with unspoken devotion and longing.",
    likes: 518,
    comments: 47,
    time: "5h ago",
    premium: true,
  },
  {
    id: "post-3",
    title: "Mitti ki Khushbu",
    author: "Simran Gill",
    initials: "SG",
    avatarBg: "bg-[#f0eaf8]",
    avatarText: "text-[#5a3a8a]",
    genre: "Kavita",
    excerpt: "The scent of earth after rain, words rising from the soil to hold your heart.",
    likes: 205,
    comments: 19,
    time: "1d ago",
    premium: false,
  },
  {
    id: "post-4",
    title: "Tere Bin (Song)",
    author: "Rohan Das",
    initials: "RD",
    avatarBg: "bg-[#fde8e8]",
    avatarText: "text-[#8a1a1a]",
    genre: "Lyrics",
    excerpt: "A melody woven for absence, each line a chord that aches and stills the room.",
    likes: 891,
    comments: 72,
    time: "2d ago",
    premium: true,
  },
  {
    id: "post-5",
    title: "Woh Ek Roz",
    author: "Neha Sharma",
    initials: "NS",
    avatarBg: "bg-[#e8f0fd]",
    avatarText: "text-[#1a3a8a]",
    genre: "Flash Fiction",
    excerpt: "A brief moment suspended in ink, where one choice changes everything.",
    likes: 167,
    comments: 31,
    time: "3d ago",
    premium: false,
  },
  {
    id: "post-6",
    title: "Samay ke Dohe",
    author: "Kabir Singh",
    initials: "KS",
    avatarBg: "bg-[#fdecea]",
    avatarText: "text-[#8a4020]",
    genre: "Dohe",
    excerpt: "Two-line truths that cut through noise and settle like warm evening light.",
    likes: 423,
    comments: 38,
    time: "4d ago",
    premium: false,
  },
];

const writers = [
  { name: "Ananya Verma", initials: "AV" },
  { name: "Rahul Mehra", initials: "RM" },
  { name: "Sana Bedi", initials: "SB" },
  { name: "Manav Joshi", initials: "MJ" },
];

const genreTags = ["Shayari", "Ghazal", "Lyrics", "Dohe", "Flash Fiction", "Kavita"];

export default function Home() {
  const [activeTab, setActiveTab] = useState<"latest" | "trending">("latest");
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [likes, setLikes] = useState<Record<string, number>>(
    samplePosts.reduce((acc, post) => ({ ...acc, [post.id]: post.likes }), {}),
  );

  const trendingPosts = useMemo(
    () => [...samplePosts].sort((a, b) => b.likes - a.likes),
    [],
  );

  const activePosts = activeTab === "latest" ? samplePosts : trendingPosts;

  const handleToggleLike = (id: string) => {
    setLikedPosts((current) => {
      const nextLiked = !current[id];
      setLikes((currentLikes) => ({
        ...currentLikes,
        [id]: currentLikes[id] + (nextLiked ? 1 : -1),
      }));
      return { ...current, [id]: nextLiked };
    });
  };

  return (
    <div className="space-y-10">
      <section className="rounded-[32px] border border-[#d9c9b1] bg-[#faf7f2] p-8 text-[#1a1209] shadow-xl">
        <div className="grid gap-8 lg:grid-cols-[1.75fr_0.95fr]">
          <div className="space-y-6">
            <p className="hero-tag" style={{ color: "#8a5a0a" }}>
              For premium writers and readers
            </p>
            <h1 className="serif-display text-5xl font-semibold">Discover quality writing every day</h1>
            <p className="max-w-2xl text-lg leading-8 text-[#6b5e4a]">
              Browse the latest and trending pieces from lyricists, poets, and short-story writers. Publish your best work, join the Vault, and earn from readers who value your words.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/publish" className="primary-button">
                Write Now
              </Link>
              <Link href="/vault" className="outline-link">
                Explore Vault
              </Link>
            </div>
          </div>
          <div className="grid gap-4 rounded-[28px] border border-[#d9c9b1] bg-[#fff5e8] p-6">
            <div className="rounded-3xl bg-[#f5e8c8] p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-[#8a5a0a]">Platform stats</p>
              <p className="mt-3 text-3xl font-semibold text-[#1a1209]">847</p>
              <p className="mt-1 text-sm text-[#6b5e4a]">Active writers</p>
            </div>
            <div className="rounded-3xl bg-[#fff2d9] p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-[#8a5a0a]">Pieces published</p>
              <p className="mt-3 text-3xl font-semibold text-[#1a1209]">12.4k</p>
              <p className="mt-1 text-sm text-[#6b5e4a]">Published this year</p>
            </div>
            <div className="rounded-3xl bg-[#f8e6d3] p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-[#8a5a0a]">Avg monthly earnings</p>
              <p className="mt-3 text-3xl font-semibold text-[#1a1209]">₹3,200</p>
              <p className="mt-1 text-sm text-[#6b5e4a]">per active creator</p>
            </div>
            <div className="rounded-3xl bg-[#f7f0dc] p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-[#8a5a0a]">Reader satisfaction</p>
              <p className="mt-3 text-3xl font-semibold text-[#1a1209]">94%</p>
              <p className="mt-1 text-sm text-[#6b5e4a]">enjoyed premium pieces</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[2.25fr_1fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-[#d9c9b1] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("latest")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "latest" ? "bg-[#8a5a0a] text-white" : "bg-[#f3ede2] text-[#1a1209]"
                }`}
              >
                Latest
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("trending")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "trending" ? "bg-[#8a5a0a] text-white" : "bg-[#f3ede2] text-[#1a1209]"
                }`}
              >
                Trending
              </button>
            </div>
            <p className="text-sm text-[#6b5e4a]">
              {activeTab === "latest" ? "Newest published writing" : "Most loved pieces by readers"}
            </p>
          </div>

          <div className="space-y-6">
            {activePosts.map((post) => (
              <article key={post.id} className="rounded-[24px] border border-[#d9c9b1] bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`avatar avatar-large flex h-14 w-14 items-center justify-center rounded-full ${post.avatarBg} ${post.avatarText} font-bold`}>
                      {post.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1a1209]">{post.author}</p>
                      <p className="text-sm text-[#6b5e4a]">{post.time}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-[#f5e8c8] bg-[#f5e8c8] px-3 py-1 text-sm font-semibold text-[#8a5a0a]">
                    {post.genre}
                  </span>
                </div>

                <h2 className="mt-5 text-2xl font-semibold text-[#1a1209]">{post.title}</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6b5e4a] line-clamp-3">{post.excerpt}</p>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0e7d8] pt-4 text-sm text-[#6b5e4a]">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post.id)}
                      className="like-button"
                    >
                      {likedPosts[post.id] ? "♥" : "♡"} {likes[post.id]}
                    </button>
                    <span>{post.comments} comments</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {post.premium ? (
                      <span className="rounded-full bg-[#f5e8c8] px-3 py-1 text-sm font-semibold text-[#8a5a0a]">⭐ Premium</span>
                    ) : (
                      <Link href="/login" className="inline-flex rounded-full border border-[#d9c9b1] bg-[#faf7f2] px-4 py-2 text-sm font-semibold text-[#1a1209] hover:border-[#c9851a]">
                        Read →
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-[#d9c9b1] bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.22em] text-[#8a5a0a]">Top writers</p>
            <div className="mt-5 space-y-4">
              {writers.map((writer) => (
                <div key={writer.name} className="flex items-center justify-between gap-4 rounded-[20px] border border-[#f0e7d8] bg-[#faf7f2] p-4">
                  <div className="flex items-center gap-3">
                    <div className="avatar avatar-inline flex h-11 w-11 items-center justify-center rounded-full bg-[#f3ede2] text-[#8a5a0a] font-semibold">
                      {writer.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1a1209]">{writer.name}</p>
                      <p className="text-sm text-[#6b5e4a]">Top contributor</p>
                    </div>
                  </div>
                  <Link href="/login" className="secondary-button text-sm">
                    Follow
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#d9c9b1] bg-[#1a1209] p-6 shadow-sm text-[#f3ede2]">
            <p className="text-sm uppercase tracking-[0.22em] text-[#f5e8c8]">Join the Vault</p>
            <h3 className="mt-4 text-2xl font-semibold">Publish premium writing</h3>
            <p className="mt-3 text-sm leading-6 text-[#c9b69f]">
              Turn your strongest poetry and lyrics into premium pieces that readers can unlock and support directly.
            </p>
            <Link href="/publish" className="mt-5 inline-flex rounded-full bg-[#f5e8c8] px-5 py-3 text-sm font-semibold text-[#1a1209] hover:bg-[#e8d4b4]">
              Start publishing
            </Link>
          </div>

          <div className="rounded-[28px] border border-[#d9c9b1] bg-[#faf7f2] p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.22em] text-[#8a5a0a]">Genre tags</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {genreTags.map((tag) => (
                <Link
                  key={tag}
                  href="/search"
                  className="rounded-full border border-[#f0e7d8] bg-[#fff6e0] px-4 py-2 text-sm text-[#8a5a0a] hover:border-[#c9851a]"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
