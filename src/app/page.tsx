import type { Metadata } from "next";
import Link from "next/link";
import HeroVideoPreview from "./components/HeroVideoPreview";
import HomeFeedClient from "./components/HomeFeedClient";
import { buildCanonical } from "./lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Home";
  const description = "Write. Share. Earn. Turn your poetry, lyrics, and stories into income.";
  const canonical = buildCanonical("/");

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: "Write. Share. Earn. | ShabadLok",
      description,
      url: canonical,
      type: "website",
    },
  };
}

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="hero-card overflow-hidden">
        <div className="relative rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(240,193,141,0.22),_transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.05),_rgba(255,255,255,0.02))] p-8 md:p-12">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle,_rgba(240,193,141,0.18),_transparent_58%)] lg:block" />
          <div className="relative max-w-3xl">
            <p className="hero-tag">For poets, storytellers, and lyricists</p>
            <h1 className="hero-title mt-4">Write. Share. Earn.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#d8cfbf]">
              Turn your poetry, lyrics, and stories into income. Build an audience, publish premium work, and earn from readers who value your voice.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/publish" className="primary-button">
                Start Writing
              </Link>
              <Link href="/vault" className="outline-link">
                Explore Writers Vault
              </Link>
            </div>
            <div className="mt-8 grid gap-3 text-sm text-[#c9bfac] md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-2xl font-semibold text-[#f5efe2]">120+</p>
                <p className="mb-0 mt-1">Readers unlocked premium writing this week</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-2xl font-semibold text-[#f5efe2]">₹5000</p>
                <p className="mb-0 mt-1">Top writer earnings snapshot</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-2xl font-semibold text-[#f5efe2]">Latest + Trending</p>
                <p className="mb-0 mt-1">Built to reward quality writing and discovery</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <HeroVideoPreview />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="hero-tag">Community feed</p>
            <h2 className="serif-display text-4xl text-[#f5efe2]">Discover fresh writing and proven favorites</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[#aba394]">
            Browse the newest posts, spot what readers are loving, and move smoothly from social discovery into premium unlocks.
          </p>
        </div>
        <HomeFeedClient />
      </section>
    </div>
  );
}
