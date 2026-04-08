"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { get, onValue, ref } from "firebase/database";
import { auth, db } from "../../firebase/config";
import { type PremiumPost, getPremiumPostCategoryLabel, normalizePremiumPost } from "../../lib/premiumPosts";
import { type Purchase, normalizePurchasesMap } from "../../lib/purchases";
import { hasUnlockedPost } from "../../lib/vault";
import PaymentUnlockButton from "../../components/PaymentUnlockButton";
import UserAvatar from "../../components/ui/UserAvatar";
import { ProfileShimmer } from "../../components/ui/Loading";
import { withAvatarVersion } from "../../lib/avatar";

export default function PremiumPostDetailPage() {
  const params = useParams();
  const postId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [post, setPost] = useState<PremiumPost | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [authorProfile, setAuthorProfile] = useState<{ avatarURL: string; avatarUpdatedAt: number }>({
    avatarURL: "",
    avatarUpdatedAt: 0,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!postId || !db) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const postRef = ref(db, `premiumPosts/${postId}`);
    const unsubscribe = onValue(
      postRef,
      async (snapshot) => {
        const normalized = normalizePremiumPost(postId, snapshot.val());
        if (!normalized) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setPost(normalized);
        setNotFound(false);

        try {
          const userSnapshot = await get(ref(db, `users/${normalized.userId}`));
          const userData = (userSnapshot.val() || {}) as Record<string, unknown>;
          setAuthorProfile({
            avatarURL: typeof userData.avatarURL === "string" ? userData.avatarURL : "",
            avatarUpdatedAt: typeof userData.avatarUpdatedAt === "number" ? userData.avatarUpdatedAt : 0,
          });
        } catch {
          setAuthorProfile({
            avatarURL: "",
            avatarUpdatedAt: 0,
          });
        }

        setLoading(false);
      },
      () => {
        setNotFound(true);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [postId]);

  useEffect(() => {
    if (!db || !user?.uid || !postId) {
      setPurchases([]);
      return;
    }

    const purchasesRef = ref(db, "purchases");
    const unsubscribe = onValue(purchasesRef, (snapshot) => {
      setPurchases(normalizePurchasesMap(snapshot.val()));
    });

    return () => unsubscribe();
  }, [user?.uid, postId]);

  const avatarUrl = withAvatarVersion(authorProfile.avatarURL, authorProfile.avatarUpdatedAt);
  const isAuthor = user?.uid === post?.userId;
  const isPurchased = useMemo(
    () => (post ? hasUnlockedPost(purchases, user?.uid, post.id) || isAuthor : false),
    [isAuthor, post, purchases, user?.uid],
  );

  if (loading) {
    return <ProfileShimmer />;
  }

  if (notFound || !post) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-[#121218]/92 px-8 py-16 text-center shadow-2xl">
        <p className="serif-display text-4xl text-[#f5efe2]">Premium post not found</p>
        <p className="mt-3 text-sm text-[#a89f90]">The piece may have been removed or is no longer available.</p>
        <Link href="/vault" className="outline-link mt-6">
          Back to Vault
        </Link>
      </div>
    );
  }

  const createdDate = new Date(post.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const unlockCountText =
    post.purchaseCount && post.purchaseCount > 0 ? `${post.purchaseCount} people unlocked this` : "120 people unlocked this";

  return (
    <div className="space-y-6">
      <Link href="/vault" className="inline-flex items-center gap-2 text-sm font-medium text-[#f0c18d] hover:text-[#f7d2a8]">
        ← Back to Vault
      </Link>

      <article className="overflow-hidden rounded-[34px] border border-white/10 bg-[#121218]/95 shadow-2xl">
        {post.imageUrl ? (
          <div className="relative h-72 overflow-hidden bg-white/5 md:h-[28rem]">
            <img src={post.imageUrl} alt={post.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(9,9,11,0.9))]" />
          </div>
        ) : null}

        <div className="space-y-8 p-6 md:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#d6a56f]/20 bg-[#d6a56f]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f0c18d]">
                  {getPremiumPostCategoryLabel(post.category)}
                </span>
                <span className="text-sm text-[#a89f90]">{unlockCountText}</span>
              </div>
              <h1 className="serif-display text-5xl leading-none text-[#f5efe2]">{post.title}</h1>
              <div className="flex items-center gap-3 text-sm text-[#a89f90]">
                <Link href={`/writers/${post.userId}`} className="flex items-center gap-3">
                  <UserAvatar src={avatarUrl} name={post.authorName} size="lg" />
                  <span className="font-medium text-[#efe7d6]">{post.authorName}</span>
                </Link>
                <span>•</span>
                <span>{createdDate}</span>
              </div>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-[#aa9f8f]">License options</p>
              <div className="mt-3 space-y-3 text-sm text-[#d2c8b7]">
                <div className="rounded-2xl bg-[#0f1015]/80 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#a89f90]">Personal license</p>
                  <p className="mt-1 text-2xl font-semibold text-[#f5efe2]">{post.personalPrice > 0 ? `₹${post.personalPrice}` : "Set a price"}</p>
                  <p className="mt-2 text-sm text-[#bfb4a3]">Unlock the full piece for private reading and non-commercial use.</p>
                </div>
                <div className="rounded-2xl bg-[#0f1015]/80 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#a89f90]">Commercial license</p>
                  <p className="mt-1 text-2xl font-semibold text-[#f5efe2]">{post.commercialPrice > 0 ? `₹${post.commercialPrice}` : "Contact author"}</p>
                  <p className="mt-2 text-sm text-[#bfb4a3]">Buy usage rights for songs, videos, or public performances with credit.</p>
                </div>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#bfb4a3]">
                Preview first, then choose your license and complete your payment securely through Razorpay.
              </p>
              <div className="mt-4">
                <PaymentUnlockButton post={post} isPurchased={Boolean(isPurchased)} onUnlocked={() => undefined} />
              </div>
            </div>
          </div>

          <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs uppercase tracking-[0.16em] text-[#aa9f8f]">Preview</p>
              <p className="serif-display mt-4 whitespace-pre-wrap text-2xl leading-10 text-[#ece3d4]">{post.previewText}</p>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs uppercase tracking-[0.16em] text-[#aa9f8f]">Why readers unlock</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[#d2c8b7]">
                <li>Read the full premium piece instantly after payment.</li>
                <li>Support writers directly with a simple one-time unlock.</li>
                <li>Keep purchased pieces saved in your purchases tab.</li>
              </ul>
            </div>
          </section>

          <section className="rounded-[30px] border border-white/10 bg-[#0e0e12] p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-[#aa9f8f]">Full content</p>
            {isPurchased ? (
              <div
                className="rich-content serif-display mt-5 text-xl leading-9 text-[#f0e7d9]"
                dangerouslySetInnerHTML={{ __html: post.fullContent }}
              />
            ) : (
              <div className="mt-5 rounded-[24px] border border-[#d6a56f]/20 bg-[#d6a56f]/8 p-6">
                <div className="pointer-events-none select-none blur-[5px]">
                  <div
                    className="rich-content serif-display text-xl leading-9 text-[#f0e7d9]"
                    dangerouslySetInnerHTML={{ __html: post.fullContent }}
                  />
                </div>
                <div className="mt-5 border-t border-white/10 pt-5">
                  <p className="text-lg font-semibold text-[#f5efe2]">Unlock the full piece to continue reading.</p>
                  <p className="mt-2 text-sm text-[#b8ae9f]">
                    Readers see the preview first. Purchase unlocks the entire work and saves it to your account.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </article>
    </div>
  );
}
