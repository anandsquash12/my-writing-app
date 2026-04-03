"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { get, push, ref, remove, set } from "firebase/database";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import { type PremiumPost, formatPrice, getPremiumPostCategoryLabel } from "../lib/premiumPosts";
import { type Purchase, normalizePurchasesMap } from "../lib/purchases";
import UserAvatar from "./ui/UserAvatar";
import { ButtonSpinner } from "./ui/Loading";
import { withAvatarVersion } from "../lib/avatar";

interface PremiumPostCardProps {
  post: PremiumPost;
  isPurchased?: boolean;
  hideAuthor?: boolean;
}

export default function PremiumPostCard({ post, isPurchased = false, hideAuthor = false }: PremiumPostCardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authorProfile, setAuthorProfile] = useState<{ avatarURL: string; avatarUpdatedAt: number }>({
    avatarURL: "",
    avatarUpdatedAt: 0,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!post.userId || !db) return;

    get(ref(db, `users/${post.userId}`))
      .then((snapshot) => {
        const data = snapshot.val();
        if (data) {
          setAuthorProfile({
            avatarURL: data.avatarURL || "",
            avatarUpdatedAt: data.avatarUpdatedAt || 0,
          });
        }
      })
      .catch(console.error);
  }, [post.userId]);

  const isAuthor = user?.uid === post.userId;
  const createdDate = new Date(post.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const handleDelete = async () => {
    if (!isAuthor || !window.confirm("Are you sure you want to delete this premium post?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const postRef = ref(db, `premiumPosts/${post.id}`);
      await remove(postRef);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const avatarUrl = withAvatarVersion(authorProfile.avatarURL, authorProfile.avatarUpdatedAt);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Author Info */}
      {!hideAuthor && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${post.userId}`} className="flex-shrink-0">
              <UserAvatar src={avatarUrl} name={post.authorName} size="md" />
            </Link>
            <div>
              <Link href={`/profile/${post.userId}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600">
                {post.authorName}
              </Link>
              <p className="text-xs text-gray-500">{createdDate}</p>
            </div>
          </div>
          {isAuthor && (
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-xs px-3 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                {isDeleting ? <ButtonSpinner /> : "Delete"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Image */}
      {post.imageUrl && (
        <div className="mb-4 rounded-lg overflow-hidden bg-gray-100 h-48">
          <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="mb-3">
        <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {getPremiumPostCategoryLabel(post.category)}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>

      {/* Preview Text */}
      <p className="text-sm text-gray-700 mb-4 line-clamp-3">{post.previewText}</p>

      {/* Lock Indicator & Price */}
      {!isPurchased && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
          <span className="text-lg">🔒</span>
          <span className="text-sm font-semibold text-yellow-800">Content locked</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-lg font-bold text-blue-600">{formatPrice(post.price)}</div>
        <Link href={`/vault/${post.id}`} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700">
          {isPurchased ? "Read" : "Unlock"}
        </Link>
      </div>
    </div>
  );
}
