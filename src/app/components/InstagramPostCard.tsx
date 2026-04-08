"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { get, onValue, ref, set } from "firebase/database";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, db } from "../firebase/config";
import { withAvatarVersion } from "../lib/avatar";
import { createNotification } from "../lib/notifications";
import { QuoteRecord } from "../lib/quotes";
import UserAvatar from "./ui/UserAvatar";

interface InstagramPostCardProps {
  post: QuoteRecord;
}

interface UserProfile {
  displayName: string;
  avatarURL: string;
  avatarUpdatedAt: number;
}

export default function InstagramPostCard({ post }: InstagramPostCardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [authorProfile, setAuthorProfile] = useState<UserProfile>({
    displayName: "",
    avatarURL: "",
    avatarUpdatedAt: 0,
  });
  const router = useRouter();

  const displayAuthorName = post.isAnonymous ? "Anonymous" : post.authorName || "Unknown creator";
  const safeImageUrl = post.imageURL.trim();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return unsubscribe;
  }, []);

  useEffect(() => {
    let active = true;
    if (!post.authorId || post.isAnonymous) {
      setAuthorProfile({ displayName: "", avatarURL: "", avatarUpdatedAt: 0 });
      return;
    }

    get(ref(db, `users/${post.authorId}`))
      .then((snapshot) => {
        if (!active) {
          return;
        }

        const data = (snapshot.val() || {}) as Record<string, unknown>;
        setAuthorProfile({
          displayName: typeof data.displayName === "string" ? data.displayName : "",
          avatarURL: typeof data.avatarURL === "string" ? data.avatarURL : "",
          avatarUpdatedAt: typeof data.avatarUpdatedAt === "number" ? data.avatarUpdatedAt : 0,
        });
      })
      .catch(() => {
        if (active) {
          setAuthorProfile({ displayName: "", avatarURL: "", avatarUpdatedAt: 0 });
        }
      });

    return () => {
      active = false;
    };
  }, [post.authorId, post.isAnonymous]);

  useEffect(() => {
    const likesRef = ref(db, `likes/${post.id}`);
    const unsubscribe = onValue(
      likesRef,
      (snapshot) => {
        const data = (snapshot.val() || {}) as Record<string, boolean>;
        setLikeCount(Object.keys(data).length);
        setLiked(Boolean(user?.uid) && data[user.uid] === true);
      },
      () => {
        setLikeCount(post.likeCount);
        setLiked(false);
      },
    );

    return () => unsubscribe();
  }, [post.id, post.likeCount, user?.uid]);

  const handleLike = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user?.uid) {
      alert("Please log in to like posts");
      return;
    }

    try {
      const likeRef = ref(db, `likes/${post.id}/${user.uid}`);
      await set(likeRef, liked ? null : true);

      if (!liked && post.authorId && post.authorId !== user.uid) {
        const userSnapshot = await get(ref(db, `users/${user.uid}`));
        const userData = (userSnapshot.val() || {}) as Record<string, unknown>;
        const actorName =
          (typeof userData.displayName === "string" && userData.displayName.trim()) ||
          user.displayName ||
          user.email ||
          "Someone";

        await createNotification(db, {
          recipientUserId: post.authorId,
          type: "like",
          actorId: user.uid,
          actorName,
          href: `/quotes/${post.id}`,
          entityId: post.id,
          entityTitle: primaryText || "Quote",
          previewText: `${actorName} liked your quote.`,
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const avatarUrl = withAvatarVersion(authorProfile.avatarURL, authorProfile.avatarUpdatedAt);
  const primaryText = post.textContent[0]?.text || "";
  const secondaryText = post.textContent[1]?.text || "";

  return (
    <div
      onClick={() => router.push(`/quotes/${post.id}`)}
      className="cursor-pointer overflow-hidden rounded-[30px] border border-white/10 bg-[#121218]/92 shadow-xl transition-all duration-200 hover:scale-[1.01] hover:shadow-2xl"
    >
      <div className="border-b border-white/8 p-5">
        <div className="flex items-center space-x-3">
          <UserAvatar name={displayAuthorName} src={avatarUrl} size="md" />
          <div className="flex-1">
            <Link
              href={`/writers/${post.authorId}`}
              onClick={(event) => event.stopPropagation()}
              className="text-sm font-semibold text-[#f4ede0] hover:underline"
            >
              {displayAuthorName}
            </Link>
            <p className="text-xs text-[#a89f90]">{new Date(post.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {!safeImageUrl ? null : (
        <div className="relative aspect-square w-full overflow-hidden bg-white/5">
          <img src={safeImageUrl} alt="Quote" className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
        </div>
      )}

      <div className="space-y-3 p-5">
        <div className="space-y-2">
          {primaryText ? <p className="serif-display text-lg font-semibold leading-relaxed text-[#f1eadb]">{primaryText}</p> : null}
          {secondaryText ? <p className="text-sm leading-relaxed text-[#c7bdad]">{secondaryText}</p> : null}
        </div>

        <div className="flex items-center space-x-4 border-t border-white/8 pt-3">
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
              liked ? "text-[#ff9e9e]" : "text-[#cfc6b6] hover:text-[#ffb7b7]"
            }`}
          >
            <span className="text-lg">{liked ? "Love" : "Like"}</span>
            <span>{likeCount}</span>
          </button>

          <div className="flex items-center space-x-2 text-sm font-medium text-[#cfc6b6]">
            <span>Comment</span>
          </div>

          <button
            type="button"
            className="flex items-center space-x-2 text-sm font-medium text-[#cfc6b6]"
            onClick={async (event) => {
              event.preventDefault();
              event.stopPropagation();

              try {
                await navigator.clipboard.writeText(`${window.location.origin}/quotes/${post.id}`);
                if (user?.uid && post.authorId && post.authorId !== user.uid) {
                  await createNotification(db, {
                    recipientUserId: post.authorId,
                    type: "share",
                    actorId: user.uid,
                    actorName: user.displayName || user.email || "Someone",
                    href: `/quotes/${post.id}`,
                    entityId: post.id,
                    entityTitle: primaryText || "Quote",
                    previewText: `${user.displayName || user.email || "Someone"} shared your quote.`,
                  });
                }
              } catch (error) {
                console.error("Share failed:", error);
              }
            }}
          >
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
