"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { get, ref, remove } from "firebase/database";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import { type PremiumPost, formatPrice, getPremiumPostCategoryLabel } from "../lib/premiumPosts";
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!post.userId || !db) {
      return;
    }

    get(ref(db, `users/${post.userId}`))
      .then((snapshot) => {
        const data = (snapshot.val() || {}) as Record<string, unknown>;
        setAuthorProfile({
          avatarURL: typeof data.avatarURL === "string" ? data.avatarURL : "",
          avatarUpdatedAt: typeof data.avatarUpdatedAt === "number" ? data.avatarUpdatedAt : 0,
        });
      })
      .catch(() => {
        setAuthorProfile({
          avatarURL: "",
          avatarUpdatedAt: 0,
        });
      });
  }, [post.userId]);

  const isAuthor = user?.uid === post.userId;
  const avatarUrl = withAvatarVersion(authorProfile.avatarURL, authorProfile.avatarUpdatedAt);
  const createdDate = new Date(post.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const socialProof = post.purchaseCount && post.purchaseCount > 0 ? `${post.purchaseCount} people unlocked this` : "120 people unlocked this";
  const priceLabel = formatPrice(post.personalPrice || post.price);
  const commercialHint = post.commercialPrice > (post.personalPrice || post.price) ? `Commercial ${formatPrice(post.commercialPrice)}` : "Commercial available";

  const handleDelete = async () => {
    if (!isAuthor || !db || !window.confirm("Are you sure you want to delete this premium post?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await remove(ref(db, `premiumPosts/${post.id}`));
      router.refresh();
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("Failed to delete post.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="group overflow-hidden rounded-[30px] border border-white/10 bg-[#121218]/92 p-5 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
      {post.imageUrl ? (
        <div className="relative mb-5 h-52 overflow-hidden rounded-[24px] bg-white/5">
          <img src={post.imageUrl} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          {!isPurchased ? (
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(9,9,11,0.8))]" />
          ) : null}
        </div>
      ) : null}

      {!hideAuthor ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href={`/writers/${post.userId}`} className="flex items-center gap-3">
            <UserAvatar src={avatarUrl} name={post.authorName} size="md" />
            <div>
              <p className="text-sm font-semibold text-[#f5efe2]">{post.authorName}</p>
              <p className="text-xs text-[#a89f90]">{createdDate}</p>
            </div>
          </Link>
          {isAuthor ? (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-full border border-[#ff9e9e]/20 px-3 py-1 text-xs font-medium text-[#ffb7b7] hover:bg-[#ff9e9e]/8"
            >
              {isDeleting ? <ButtonSpinner /> : "Delete"}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[#d6a56f]/20 bg-[#d6a56f]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f0c18d]">
          {getPremiumPostCategoryLabel(post.category)}
        </span>
        <span className="text-xs text-[#a89f90]">{socialProof}</span>
      </div>

      <h3 className="serif-display text-3xl leading-tight text-[#f5efe2]">{post.title}</h3>
      <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#cfc6b6]">{post.previewText}</p>

      <div className="mt-5 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-[#aa9f8f]">{isPurchased ? "Unlocked" : "Locked preview"}</p>
        <p className={`mt-3 text-sm leading-7 text-[#e4dccd] ${isPurchased ? "" : "blur-[3px] select-none"}`}>
          {post.fullContent.replace(/<[^>]*>/g, " ").slice(0, 170) || "Premium content preview"}
        </p>
      </div>

      <div className="mt-5 space-y-4 border-t border-white/8 pt-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#aa9f8f]">Personal unlock</p>
          <p className="mt-1 text-2xl font-semibold text-[#f0c18d]">{priceLabel}</p>
          <p className="mt-2 text-xs text-[#b8ae9f]">{commercialHint}</p>
        </div>
        <Link
          href={`/vault/${post.id}`}
          className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
            isPurchased ? "bg-white/8 text-[#f5efe2] hover:bg-white/12" : "bg-[#f0c18d] text-[#140f0b] hover:opacity-90"
          }`}
        >
          {isPurchased ? "Read Full Piece" : "Unlock Story"}
        </Link>
      </div>
    </article>
  );
}
