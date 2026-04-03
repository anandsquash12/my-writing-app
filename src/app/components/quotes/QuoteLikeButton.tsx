"use client";

import { useEffect, useState } from "react";
import { get, onValue, ref, set } from "firebase/database";
import { database } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { createNotification } from "../../lib/notifications";

interface QuoteLikeButtonProps {
  quoteId: string;
  likeCount: number;
  authorId?: string;
  quoteTitle?: string;
}

export default function QuoteLikeButton({ quoteId, likeCount, authorId = "", quoteTitle = "Quote" }: QuoteLikeButtonProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(likeCount);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!quoteId) {
      setLiked(false);
      setCount(likeCount);
      return;
    }

    const likeRef = ref(database, `likes/${quoteId}`);
    const unsubscribe = onValue(likeRef, (snapshot) => {
      const data = (snapshot.val() || {}) as Record<string, boolean>;
      setCount(Object.keys(data).length);
      setLiked(Boolean(user?.uid) && data[user.uid] === true);
    });

    return () => unsubscribe();
  }, [likeCount, quoteId, user?.uid]);

  const handleToggleLike = async () => {
    if (!user?.uid || saving) {
      return;
    }

    setSaving(true);
    try {
      const userLikeRef = ref(database, `likes/${quoteId}/${user.uid}`);
      await set(userLikeRef, liked ? null : true);

      if (!liked && authorId && authorId !== user.uid) {
        const userSnapshot = await get(ref(database, `users/${user.uid}`));
        const userData = (userSnapshot.val() || {}) as Record<string, unknown>;
        const actorName =
          (typeof userData.displayName === "string" && userData.displayName.trim()) ||
          user.displayName ||
          user.email ||
          "Someone";

        await createNotification(database, {
          recipientUserId: authorId,
          type: "like",
          actorId: user.uid,
          actorName,
          href: `/quotes/${quoteId}`,
          entityId: quoteId,
          entityTitle: quoteTitle,
          previewText: `${actorName} liked your quote.`,
        });
      }
    } catch (error) {
      console.error("Like toggle failed:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={handleToggleLike}
      disabled={!user?.uid || saving}
      className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-60"
      type="button"
    >
      {liked ? "Liked" : "Like"} ({count})
    </button>
  );
}
