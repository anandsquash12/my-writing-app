"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { get, onValue, ref, set } from "firebase/database";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import { createNotification } from "../lib/notifications";

interface LikeButtonProps {
  postId: string;
  likeCount?: number;
  authorId?: string;
  postTitle?: string;
}

export default function LikeButton({ postId, likeCount = 0, authorId = "", postTitle = "Post" }: LikeButtonProps) {
  const [user, setUser] = useState<User | null>(null);
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(likeCount);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onValue(
      ref(db, `likes/${postId}`),
      (snapshot) => {
        const data = (snapshot.val() || {}) as Record<string, boolean>;
        setCount(Object.keys(data).length);
        setLiked(Boolean(user?.uid) && data[user.uid] === true);
      },
      () => {
        setCount(likeCount);
        setLiked(false);
      },
    );

    return () => unsubscribe();
  }, [likeCount, postId, user?.uid]);

  const handleLike = async () => {
    if (!user?.uid || busy) {
      if (!user?.uid) {
        alert("Please log in to like posts.");
      }
      return;
    }

    try {
      setBusy(true);
      const userLikeRef = ref(db, `likes/${postId}/${user.uid}`);
      await set(userLikeRef, liked ? null : true);

      if (!liked && authorId && authorId !== user.uid) {
        const userSnapshot = await get(ref(db, `users/${user.uid}`));
        const userData = (userSnapshot.val() || {}) as Record<string, unknown>;
        const actorName =
          (typeof userData.displayName === "string" && userData.displayName.trim()) ||
          user.displayName ||
          user.email ||
          "Someone";

        await createNotification(db, {
          recipientUserId: authorId,
          type: "like",
          actorId: user.uid,
          actorName,
          href: `/posts/${postId}`,
          entityId: postId,
          entityTitle: postTitle,
          previewText: `${actorName} liked your post.`,
        });
      }
    } catch {
      alert("Failed to update like.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className="font-medium text-neutral-800 hover:text-black"
      onClick={(event) => {
        event.stopPropagation();
        void handleLike();
      }}
      disabled={busy}
    >
      {liked ? "Unlike" : "Like"} ({count})
    </button>
  );
}
