"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { get, onValue, ref } from "firebase/database";
import { auth, db } from "../../firebase/config";
import { type PremiumPost, getPremiumPostCategoryLabel, normalizePremiumPost } from "../../lib/premiumPosts";
import { type Purchase, normalizePurchasesMap } from "../../lib/purchases";
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
  const [authorProfile, setAuthorProfile] = useState<{ avatarURL: string; avatarUpdatedAt: number }>({
    avatarURL: "",
    avatarUpdatedAt: 0,
  });
  const [isPurchased, setIsPurchased] = useState(false);

  // Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Load post
  useEffect(() => {
    if (!postId || !db) return;

    const postRef = ref(db, `premiumPosts/${postId}`);
    const unsubscribe = onValue(
      postRef,
      (snapshot) => {
        const data = snapshot.val();
        const normalized = normalizePremiumPost(postId, data);

        if (!normalized) {
          setNotFound(true);
        } else {
          setPost(normalized);

          // Load author profile
          get(ref(db, `users/${normalized.userId}`))
            .then((userSnapshot) => {
              const userData = userSnapshot.val();
              if (userData) {
                setAuthorProfile({
                  avatarURL: userData.avatarURL || "",
                  avatarUpdatedAt: userData.avatarUpdatedAt || 0,
                });
              }
            })
            .catch(console.error);
        }

        setLoading(false);
      },
      (error) => {
        console.error("Error loading post:", error);
        setNotFound(true);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [postId]);

  // Check purchase status
  useEffect(() => {
    if (!user?.uid || !postId || !db) {
      setIsPurchased(false);
      return;
    }

    const purchasesRef = ref(db, "purchases");
    const unsubscribe = onValue(purchasesRef, (snapshot) => {
      const data = snapshot.val();
      const allPurchases = normalizePurchasesMap(data);
      const hasPurchased = allPurchases.some(
        (purchase) => purchase.userId === user.uid && purchase.postId === postId,
      );
      setIsPurchased(hasPurchased);
    });

    return () => unsubscribe();
  }, [user?.uid, postId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProfileShimmer />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 mb-4">Premium post not found</p>
          <Link href="/vault" className="text-blue-600 hover:text-blue-700 font-semibold">
            ← Back to Vault
          </Link>
        </div>
      </div>
    );
  }

  const avatarUrl = withAvatarVersion(authorProfile.avatarURL, authorProfile.avatarUpdatedAt);
  const isAuthor = user?.uid === post.userId;
  const createdDate = new Date(post.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back button */}
        <Link href="/vault" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-8">
          ← Back to Vault
        </Link>

        {/* Main content */}
        <article className="bg-white rounded-lg shadow-sm p-8">
          {/* Cover Image */}
          {post.imageUrl && (
            <div className="mb-8 rounded-lg overflow-hidden bg-gray-100 h-96">
              <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Author Info */}
          <div className="flex items-center gap-4 pb-8 border-b border-gray-200">
            <Link href={`/profile/${post.userId}`} className="flex-shrink-0">
              <UserAvatar src={avatarUrl} name={post.authorName} size="lg" />
            </Link>
            <div className="flex-1">
              <Link href={`/profile/${post.userId}`} className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                {post.authorName}
              </Link>
              <p className="text-sm text-gray-500">{createdDate}</p>
            </div>
            <PaymentUnlockButton
              post={post}
              isPurchased={isPurchased || isAuthor}
              onUnlocked={() => {
                setIsPurchased(true);
              }}
            />
          </div>

          {/* Title */}
          <div className="mt-8 mb-3">
            <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {getPremiumPostCategoryLabel(post.category)}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mt-8 mb-4">{post.title}</h1>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            {/* Preview always visible */}
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Preview</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{post.previewText}</p>
            </div>

            {/* Full content - shown if purchased or author */}
            {isPurchased || isAuthor ? (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Full Content</h2>
                <div
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: post.fullContent }}
                />
              </div>
            ) : (
              <div className="mb-8 p-8 bg-yellow-50 rounded-lg border-2 border-yellow-200 text-center">
                <p className="text-lg text-yellow-800 font-semibold mb-4">🔒 Full content is locked</p>
                <p className="text-yellow-700 mb-6">Unlock this premium post to read the complete content</p>
                <PaymentUnlockButton
                  post={post}
                  isPurchased={isPurchased}
                  onUnlocked={() => {
                    setIsPurchased(true);
                  }}
                />
              </div>
            )}
          </div>

          {/* Stats */}
          {post.purchaseCount !== undefined && post.purchaseCount > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200 flex gap-8 text-sm text-gray-600">
              <div>
                <div className="text-2xl font-bold text-gray-900">{post.purchaseCount}</div>
                <div>People have unlocked this</div>
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
