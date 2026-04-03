"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { get, onValue, ref } from "firebase/database";
import { auth, db } from "../firebase/config";
import { type PremiumPost, normalizePremiumPost } from "../lib/premiumPosts";
import { type Purchase, normalizePurchasesMap } from "../lib/purchases";
import UserAvatar from "../components/ui/UserAvatar";
import { ProfileShimmer } from "../components/ui/Loading";
import { withAvatarVersion } from "../lib/avatar";

interface PurchaseWithPost extends Purchase {
  post?: PremiumPost;
}

export default function MyPurchasesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<PurchaseWithPost[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setPurchases([]);
      setLoading(false);
      return;
    }

    // Load all purchases for current user
    const purchasesRef = ref(db, "purchases");
    const unsubscribePurchases = onValue(purchasesRef, async (snapshot) => {
      const data = snapshot.val();
      const allPurchases = normalizePurchasesMap(data);
      const userPurchases = allPurchases.filter((purchase) => purchase.userId === user.uid);

      // Load post details for each purchase
      const purchasesWithPosts = await Promise.all(
        userPurchases.map(async (purchase) => {
          try {
            const postSnapshot = await get(ref(db, `premiumPosts/${purchase.postId}`));
            const postData = postSnapshot.val();
            const post = normalizePremiumPost(purchase.postId, postData);

            return {
              ...purchase,
              post: post || undefined,
            };
          } catch {
            return purchase;
          }
        }),
      );

      setPurchases(purchasesWithPosts.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    });

    return () => unsubscribePurchases();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ProfileShimmer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-900 mb-4">You must be logged in to view your purchases</p>
          <Link href="/login" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📖 My Purchases</h1>
          <p className="text-lg text-gray-600">Premium content you've unlocked</p>
        </div>

        {/* Content */}
        {purchases.length > 0 ? (
          <div className="space-y-4">
            {purchases.map((purchase) => {
              if (!purchase.post) return null;

              const post = purchase.post;
              const purchaseDate = new Date(purchase.createdAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <Link key={purchase.id} href={`/vault/${post.id}`}>
                  <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer">
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      {post.imageUrl && (
                        <div className="flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                          <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">{post.previewText}</p>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>By {post.authorName}</span>
                          <span>Purchased {purchaseDate}</span>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="flex-shrink-0 flex items-center">
                        <div className="text-center">
                          <div className="text-green-600 font-semibold mb-2">✓ Unlocked</div>
                          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700">
                            Read
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <p className="text-lg text-gray-600">You haven't purchased any premium content yet</p>
            <p className="text-sm text-gray-500 mt-2">Explore the Writers Vault to find amazing premium content</p>
            <Link href="/vault" className="mt-6 inline-block px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
              Browse Vault
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
