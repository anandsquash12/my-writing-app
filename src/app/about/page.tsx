import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn how ShabadLok helps writers publish, grow an audience, and earn from premium work.",
  openGraph: {
    title: "About ShabadLok",
    description: "A premium social platform where writers can write, share, and earn.",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#121218]/92 p-8 shadow-2xl">
        <p className="hero-tag">Our mission</p>
        <h1 className="serif-display mt-4 text-5xl text-[#f5efe2]">A platform built for serious writing</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[#d2c8b7]">
          ShabadLok helps poets, lyricists, and storytellers publish beautiful work, grow loyal readers, and earn from premium pieces without losing the social energy of a living community.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="hero-tag">Write</p>
          <p className="mt-3 text-sm leading-7 text-[#d2c8b7]">Craft public posts, private drafts, and premium content in one place with a writing-first experience.</p>
        </div>
        <div className="card">
          <p className="hero-tag">Share</p>
          <p className="mt-3 text-sm leading-7 text-[#d2c8b7]">Reach readers through a social feed that highlights both the latest work and the writing audiences already love.</p>
        </div>
        <div className="card">
          <p className="hero-tag">Earn</p>
          <p className="mt-3 text-sm leading-7 text-[#d2c8b7]">Sell premium poetry, lyrics, and stories through Writers Vault with trusted payment flows.</p>
        </div>
      </section>
    </div>
  );
}
