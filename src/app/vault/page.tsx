"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import PremiumPostCard from "../components/PremiumPostCard";
import { ProfileShimmer } from "../components/ui/Loading";

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
    const postsRef = ref(db, "premiumPosts");
    const unsubscribePosts = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      setPremiumPosts(normalizePremiumPostsMap(data));
      setLoading(false);
    });

    return () => {
      unsubscribePosts();
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setPurchases([]);
      return;
    }

    const purchasesRef = ref(db, "purchases");
    const unsubscribePurchases = onValue(purchasesRef, (snapshot) => {
      const data = snapshot.val();
      const allPurchases = normalizePurchasesMap(data);
      const userPurchases = allPurchases.filter((purchase) => purchase.userId === user.uid);
      setPurchases(userPurchases);
    });

    return () => {
      unsubscribePurchases();
    };
  }, [user?.uid]);

  const purchasedPostIds = new Set(purchases.map((purchase) => purchase.postId));
  const filteredPosts =
    selectedCategory === "all"
      ? premiumPosts
      : premiumPosts.filter((post) => post.category === selectedCategory);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ProfileShimmer />
      </div>
    );
  }

  const hasPosts = premiumPosts.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Writers Vault</h1>
          <p className="text-lg text-gray-600">Premium content from writers you love</p>
          {user ? (
            <Link
              href="/vault/create"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Publish Premium Content
            </Link>
          ) : (
            <p className="mt-4 text-sm text-gray-600">
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                Sign in
              </Link>{" "}
              to publish premium content
            </p>
          )}
        </div>

        {hasPosts ? (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">Browse by category:</span>
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {PREMIUM_POST_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {getPremiumPostCategoryLabel(category)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {hasPosts ? (
          filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <PremiumPostCard key={post.id} post={post} isPurchased={purchasedPostIds.has(post.id)} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
              <p className="text-lg font-semibold text-gray-900">No posts in this category yet</p>
              <p className="mt-2 text-sm text-gray-500">Try another category or publish the first one in this section.</p>
            </div>
          )
        ) : (
          <div className="py-16 text-center">
            <p className="text-lg text-gray-600">No premium posts yet</p>
            <p className="mt-2 text-sm text-gray-500">Be the first to publish premium content!</p>
            {user ? (
              <Link
                href="/vault/create"
                className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
              >
                Create Premium Post
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
