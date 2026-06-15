"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { auth, db } from "../firebase/config";
import {
  PREMIUM_POST_CATEGORIES,
  type PremiumPost,
  type PremiumPostCategory,
  getPremiumPostCategoryLabel,
  normalizePremiumPostsMap,
} from "../lib/premiumPosts";
import { type Purchase, normalizePurchasesMap } from "../lib/purchases";
import { getUnlockedPostIds } from "../lib/vault";
import PremiumPostCard from "../components/PremiumPostCard";
import { VaultSkeleton } from "../components/ui/Loading";

export default function VaultPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [premiumPosts, setPremiumPosts] = useState<PremiumPost[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PremiumPostCategory | "all">("all");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const postsRef = ref(db, "premiumPosts");
    const unsubscribePosts = onValue(postsRef, (snapshot) => {
      setPremiumPosts(normalizePremiumPostsMap(snapshot.val()));
      setLoading(false);
    });

    return () => unsubscribePosts();
  }, []);

  useEffect(() => {
    if (!user?.uid || !db) {
      setPurchases([]);
      return;
    }

    const purchasesRef = ref(db, "purchases");
    const unsubscribePurchases = onValue(purchasesRef, (snapshot) => {
      setPurchases(normalizePurchasesMap(snapshot.val()));
    });

    return () => unsubscribePurchases();
  }, [user?.uid]);

  const unlockedPostIds = useMemo(() => getUnlockedPostIds(purchases, user?.uid), [purchases, user?.uid]);
  const filteredPosts =
    selectedCategory === "all" ? premiumPosts : premiumPosts.filter((post) => post.category === selectedCategory);
  const trendingPremium = useMemo(
    () =>
      [...premiumPosts]
        .sort((a, b) => (b.purchaseCount || 0) - (a.purchaseCount || 0) || (b.likeCount || 0) - (a.likeCount || 0))
        .slice(0, 3),
    [premiumPosts],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <VaultSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-white/10 bg-[#121218]/92 p-8 shadow-2xl">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="hero-tag">Premium marketplace</p>
            <h1 className="serif-display mt-4 text-5xl text-[#f5efe2]">Writers Vault</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#d2c8b7]">
              Discover premium poetry, lyrics, stories, and shayari. Preview the hook, unlock the full piece, and support writers directly.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/vault/create" className="primary-button">
                Publish Premium Writing
              </Link>
              <Link href="/my-purchases" className="outline-link">
                View My Purchases
              </Link>
            </div>
          </div>
          <div className="grid gap-3 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 text-sm text-[#d9cfbe]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#aa9f8f]">Social proof</p>
              <p className="mt-2 text-2xl font-semibold text-[#f0c18d]">120 people unlocked this</p>
              <p className="mt-1">Readers are already paying to access premium writing.</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-[#f0c18d]">Top writer earned ₹5000</p>
              <p className="mt-1">Use premium posts to turn your strongest work into revenue.</p>
            </div>
          </div>
        </div>
      </section>

      {trendingPremium.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="hero-tag">Conversion booster</p>
              <h2 className="serif-display text-4xl text-[#f5efe2]">Trending Premium</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#a89f90]">
              Sorted by unlock momentum and engagement to surface the pieces readers are paying for now.
            </p>
          </div>
          <div className="premium-grid md:grid-cols-2 xl:grid-cols-3">
            {trendingPremium.map((post) => (
              <PremiumPostCard key={`trending-${post.id}`} post={post} isPurchased={unlockedPostIds.has(post.id)} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-[#121218]/92 p-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                selectedCategory === "all" ? "bg-[#f0c18d] text-[#140f0b]" : "bg-white/5 text-[#ece3d4]"
              }`}
            >
              All Premium
            </button>
            {PREMIUM_POST_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  selectedCategory === category ? "bg-[#f0c18d] text-[#140f0b]" : "bg-white/5 text-[#ece3d4]"
                }`}
              >
                {getPremiumPostCategoryLabel(category)}
              </button>
            ))}
          </div>
          <p className="text-sm text-[#a89f90]">{filteredPosts.length} premium posts available</p>
        </div>

        {filteredPosts.length > 0 ? (
          <div className="premium-grid md:grid-cols-2 xl:grid-cols-3">
            {filteredPosts.map((post) => (
              <PremiumPostCard key={post.id} post={post} isPurchased={unlockedPostIds.has(post.id)} />
            ))}
          </div>
        ) : (
          <div className="rounded-[30px] border border-dashed border-white/10 bg-[#121218]/90 px-6 py-14 text-center">
            <p className="serif-display text-3xl text-[#f3ead9]">No premium posts yet</p>
            <p className="mt-2 text-sm text-[#a89f90]">Be the first writer to publish premium work and set the bar for the vault.</p>
            <Link href="/vault/create" className="outline-link mt-6">
              Create Your First Premium Post
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
