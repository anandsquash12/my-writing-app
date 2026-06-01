"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const moodTags = ["#Nostalgia", "#Ishq", "#Dard", "#Khushi", "#Tanhai", "#Barish", "#Umang", "#Gham"];

const featuredWriters = [
  { name: "Priya Kaur", initials: "PK" },
  { name: "Arjun Mehta", initials: "AM" },
  { name: "Simran Gill", initials: "SG" },
  { name: "Rohan Das", initials: "RD" },
];

const samplePosts = [
  {
    id: "s1",
    title: "Tanhai mein khoya",
    author: "Priya Kaur",
    genre: "Poetry",
    excerpt: "A lonely verse that holds the ache of absence and the warmth of memory.",
  },
  {
    id: "s2",
    title: "Dil ki dastan",
    author: "Arjun Mehta",
    genre: "Ghazal",
    excerpt: "A narrative of the heart that circles back to the same tender wound.",
  },
  {
    id: "s3",
    title: "Barish ka Safar",
    author: "Neha Sharma",
    genre: "Flash Fiction",
    excerpt: "Rain becomes the stage for a sudden meeting that changes both lives.",
  },
  {
    id: "s4",
    title: "Khushi ke pal",
    author: "Simran Gill",
    genre: "Kavita",
    excerpt: "Little joys woven into a poem that feels like sunlight on your face.",
  },
  {
    id: "s5",
    title: "Yaadein song",
    author: "Rohan Das",
    genre: "Lyrics",
    excerpt: "A song of memories and the wish to hold them close in every line.",
  },
  {
    id: "s6",
    title: "Dohe of zindagi",
    author: "Kabir Singh",
    genre: "Dohe",
    excerpt: "Two-line wisdom that makes quiet sense of restless days.",
  },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalizedQuery) {
      return samplePosts;
    }
    return samplePosts.filter((post) => {
      return [post.title, post.author, post.genre, post.excerpt]
        .some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [normalizedQuery]);

  return (
    <div className="space-y-8">
      <div className="rounded-[28px] border border-[#e7dccd] bg-[#faf7f2] p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="hero-tag" style={{ color: "#8a5a0a" }}>
              Search the Vault
            </p>
            <h1 className="serif-display text-4xl font-semibold text-[#1a1209]">Find your next piece</h1>
          </div>
          <div className="relative w-full md:max-w-lg">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, author, genre, or mood"
              className="input w-full rounded-[20px] border border-[#e7dccd] bg-white px-4 py-4 text-[#1a1209]"
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#6b5e4a]">🔍</span>
          </div>
        </div>
      </div>

      {normalizedQuery ? (
        <div className="rounded-[28px] border border-[#e7dccd] bg-white p-6 shadow-sm">
          <p className="text-sm text-[#6b5e4a]">{results.length} result{results.length === 1 ? "" : "s"} for "{query}"</p>
        </div>
      ) : null}

      {!normalizedQuery ? (
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[28px] border border-[#e7dccd] bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.22em] text-[#8a5a0a]">Featured writers</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {featuredWriters.map((writer) => (
                <div key={writer.name} className="rounded-[24px] border border-[#f0e7d8] bg-[#faf7f2] p-4">
                  <div className="flex items-center gap-4">
                    <div className="avatar avatar-large flex h-12 w-12 items-center justify-center rounded-full bg-[#f3ede2] text-[#8a5a0a] font-semibold">
                      {writer.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1a1209]">{writer.name}</p>
                      <p className="text-sm text-[#6b5e4a]">Featured creator</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-[#e7dccd] bg-[#fff6e0] p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.22em] text-[#8a5a0a]">Browse by mood</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {moodTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setQuery(tag.replace("#", ""))}
                  className="rounded-full border border-[#f0e7d8] bg-[#faf3e3] px-4 py-2 text-sm text-[#8a5a0a] hover:border-[#c9851a]"
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {normalizedQuery && results.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[#e7dccd] bg-[#faf7f2] p-10 text-center text-[#6b5e4a]">
          <p className="serif-display text-3xl text-[#1a1209]">No pieces found for {query}</p>
          <p className="mt-3 text-sm">Try another mood, author, or keyword.</p>
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-[#8a5a0a]">All Recent Pieces</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#1a1209]">Fresh writing streams</h2>
          </div>
          <Link href="/login" className="inline-flex rounded-full border border-[#e7dccd] bg-[#faf7f2] px-4 py-2 text-sm text-[#1a1209] hover:border-[#c9851a]">
            Login to unlock more
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {results.map((post) => (
            <article key={post.id} className="rounded-[24px] border border-[#e7dccd] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#1a1209]">{post.author}</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8a5a0a]">{post.genre}</p>
                </div>
                <Link href="/login" className="rounded-full border border-[#f0e7d8] bg-[#faf7f2] px-3 py-2 text-xs text-[#1a1209] hover:border-[#c9851a]">
                  Read →
                </Link>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-[#1a1209]">{post.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#6b5e4a] line-clamp-2">{post.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
