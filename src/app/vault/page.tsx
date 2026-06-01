"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const categories = ["all", "poetry", "ghazal", "lyrics", "story"] as const;

const vaultItems = [
  {
    title: "Pehli Baarish",
    author: "Arjun Mehta",
    initials: "AM",
    genre: "Ghazal",
    price: 29,
    excerpt: "Monsoon memories unfurl in verses that shimmer with silence and longing.",
    avatarBg: "bg-[#e8f4f0]",
    avatarText: "text-[#1a6b52]",
  },
  {
    title: "Rooh ka Safar",
    author: "Priya Kaur",
    initials: "PK",
    genre: "Poetry",
    price: 49,
    excerpt: "A soul’s journey through quiet dawns, inked in soft, aching language.",
    avatarBg: "bg-[#fdf3e3]",
    avatarText: "text-[#8a5a0a]",
  },
  {
    title: "Yaadein Song",
    author: "Rohan Das",
    initials: "RD",
    genre: "Lyrics",
    price: 39,
    excerpt: "A melodic memory that lingers like a chorus you can’t stop humming.",
    avatarBg: "bg-[#fde8e8]",
    avatarText: "text-[#8a1a1a]",
  },
  {
    title: "Teen Raste",
    author: "Simran Gill",
    initials: "SG",
    genre: "Story",
    price: 59,
    excerpt: "Three paths cross in a story of choice, loss, and quiet triumph.",
    avatarBg: "bg-[#f0eaf8]",
    avatarText: "text-[#5a3a8a]",
  },
  {
    title: "Khwabon ka Bazaar",
    author: "Neha Sharma",
    initials: "NS",
    genre: "Poetry",
    price: 35,
    excerpt: "A marketplace of dreams where each line opens a new doorway.",
    avatarBg: "bg-[#e8f0fd]",
    avatarText: "text-[#1a3a8a]",
  },
  {
    title: "Tanhai Mein Tum",
    author: "Kabir Singh",
    initials: "KS",
    genre: "Ghazal",
    price: 45,
    excerpt: "A lonely heart speaks in tender rhythms that ache with company.",
    avatarBg: "bg-[#fdecea]",
    avatarText: "text-[#8a4020]",
  },
  {
    title: "Dil ke Darwaze",
    author: "Arjun Mehta",
    initials: "AM",
    genre: "Poetry",
    price: 29,
    excerpt: "Heart doors open quietly to a poem that feels both intimate and vast.",
    avatarBg: "bg-[#e8f4f0]",
    avatarText: "text-[#1a6b52]",
  },
  {
    title: "Mann Mera (Song)",
    author: "Priya Kaur",
    initials: "PK",
    genre: "Lyrics",
    price: 55,
    excerpt: "A confession in melody, where every line moves like a gentle refrain.",
    avatarBg: "bg-[#fdf3e3]",
    avatarText: "text-[#8a5a0a]",
  },
];

export default function VaultPage() {
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>("all");

  const filteredItems = useMemo(() => {
    if (selectedCategory === "all") {
      return vaultItems;
    }
    return vaultItems.filter((item) => item.genre.toLowerCase() === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="space-y-10">
      <section className="rounded-[32px] border border-[#c5b197] bg-[#1a1209] p-8 text-[#f3ead9] shadow-xl">
        <div className="max-w-4xl space-y-4">
          <p className="hero-tag" style={{ color: "#f5e8c8" }}>
            Exclusive premium writing
          </p>
          <h1 className="serif-display text-5xl font-semibold">Writers Vault</h1>
          <p className="max-w-3xl text-lg leading-8 text-[#d2bfae]">
            Step into the Vault for premium poetry, ghazal, lyrics, and stories curated for readers who cherish quality. Unlock the best work from top writers and support their craft.
          </p>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#e7dccd] bg-[#faf7f2] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedCategory === category
                    ? "bg-[#8a5a0a] text-white"
                    : "bg-[#f3ede2] text-[#1a1209]"
                }`}
              >
                {category === "all" ? "All" : category[0].toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-sm text-[#6b5e4a]">{filteredItems.length} premium pieces</p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {filteredItems.map((item) => (
          <article key={item.title} className="overflow-hidden rounded-[28px] border border-[#e7dccd] bg-white shadow-sm">
            <div className="bg-[#f3ede2] p-5">
              <span className="inline-flex rounded-[20px] bg-[#f5e8c8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a5a0a]">
                {item.genre}
              </span>
              <h2 className="mt-4 text-xl font-semibold text-[#1a1209]">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#6b5e4a] italic font-serif line-clamp-2">{item.excerpt}</p>
            </div>
            <div className="flex flex-col gap-4 border-t border-[#e7dccd] p-5">
              <div className="flex items-center gap-3">
                <div className={`avatar avatar-large flex h-12 w-12 items-center justify-center rounded-full ${item.avatarBg} ${item.avatarText} font-semibold`}>
                  {item.initials}
                </div>
                <div>
                  <p className="font-semibold text-[#1a1209]">{item.author}</p>
                  <p className="text-sm text-[#6b5e4a]">Premium unlock</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#1a1209]">₹{item.price}</p>
                <Link href="/login" className="primary-button">
                  Unlock
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[28px] border border-[#e7dccd] bg-[#fff4df] p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-[#8a5a0a]">Ready to publish?</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#1a1209]">Want your writing in the Vault?</h2>
          </div>
          <Link href="/publish" className="primary-button">
            Publish in Vault
          </Link>
        </div>
      </section>
    </div>
  );
}
