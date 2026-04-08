"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { get, onValue, ref } from "firebase/database";
import { auth, db } from "../firebase/config";
import { normalizePremiumPost, type PremiumPost } from "../lib/premiumPosts";
import { normalizePurchasesMap, type Purchase } from "../lib/purchases";
import { ProfileShimmer } from "../components/ui/Loading";

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
    if (!user?.uid || !db) {
      setPurchases([]);
      setLoading(false);
      return;
    }

    const purchasesRef = ref(db, "purchases");
    const unsubscribePurchases = onValue(purchasesRef, async (snapshot) => {
      const userPurchases = normalizePurchasesMap(snapshot.val()).filter((purchase) => purchase.userId === user.uid);

      const purchasesWithPosts = await Promise.all(
        userPurchases.map(async (purchase) => {
          try {
            const postSnapshot = await get(ref(db, `premiumPosts/${purchase.postId}`));
            const post = normalizePremiumPost(purchase.postId, postSnapshot.val());
            return { ...purchase, post: post || undefined };
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
    return <ProfileShimmer />;
  }

  if (!user) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-[#121218]/92 px-8 py-16 text-center shadow-2xl">
        <p className="serif-display text-4xl text-[#f5efe2]">Sign in to view your purchases</p>
        <Link href="/login" className="primary-button mt-6">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#121218]/92 p-8 shadow-2xl">
        <p className="hero-tag">Library</p>
        <h1 className="serif-display mt-4 text-5xl text-[#f5efe2]">My Purchases</h1>
        <p className="mt-4 text-lg leading-8 text-[#d2c8b7]">Your unlocked premium writing lives here, ready to revisit any time.</p>
      </section>

      {purchases.length > 0 ? (
        <div className="space-y-4">
          {purchases.map((purchase) => {
            if (!purchase.post) {
              return null;
            }

            return (
              <Link key={purchase.id} href={`/vault/${purchase.post.id}`} className="rounded-[28px] border border-white/10 bg-[#121218]/92 p-5 shadow-xl transition hover:-translate-y-0.5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  {purchase.post.imageUrl ? (
                    <div className="h-28 w-full overflow-hidden rounded-[20px] bg-white/5 md:w-40">
                      <img src={purchase.post.imageUrl} alt={purchase.post.title} className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#a99f90]">
                      Purchased {new Date(purchase.createdAt).toLocaleDateString("en-IN")}
                    </p>
                    <h3 className="serif-display mt-2 text-3xl text-[#f5efe2]">{purchase.post.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[#cfc6b6]">{purchase.post.previewText}</p>
                  </div>
                  <div className="space-y-2 text-right">
                  <div className="rounded-full border border-[#9ddeaf]/20 bg-[#9ddeaf]/10 px-4 py-2 text-sm font-semibold text-[#dff5e3]">
                    Unlocked
                  </div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#a89f90]">{purchase.licenseType === "commercial" ? "Commercial license" : "Personal license"}</p>
                </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[30px] border border-dashed border-white/10 bg-[#121218]/90 p-10 text-center">
          <p className="serif-display text-3xl text-[#f3ead9]">No purchases yet</p>
          <p className="mt-2 text-sm text-[#a89f90]">Explore the Writers Vault and unlock premium stories, lyrics, and poetry.</p>
          <Link href="/vault" className="outline-link mt-6">
            Browse Vault
          </Link>
        </div>
      )}
    </div>
  );
}
