"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import { onAuthStateChanged, type User } from "firebase/auth";
import { onValue, ref, runTransaction } from "firebase/database";
import { useRouter } from "next/navigation";

interface LikeButtonProps {
  postId: string;
  likeCount: number;
}

export default function LikeButton({ postId, likeCount }: LikeButtonProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(likeCount);

  useEffect(() => {
    setCount(likeCount);
  }, [likeCount]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setLiked(false);
      return;
    }

    const likeRef = ref(db, `likes/${postId}/${user.uid}`);
    const unsubscribe = onValue(likeRef, (snapshot) => {
      setLiked(snapshot.val() === true);
    });
    return () => unsubscribe();
  }, [postId, user]);

  const handleToggleLike = async () => {
    if (!user) {
      alert("Please log in to like posts.");
      router.push("/login");
      return;
    }

    try {
      setBusy(true);

      const likeRef = ref(db, `likes/${postId}/${user.uid}`);
      const toggleResult = await runTransaction(likeRef, (current) => {
        return current === true ? null : true;
      });

      if (!toggleResult.committed) {
        return;
      }

      const isLikedNow = toggleResult.snapshot.val() === true;
      const delta = isLikedNow ? 1 : -1;

      const likeCountRef = ref(db, `posts/${postId}/likeCount`);
      await runTransaction(likeCountRef, (current) => {
        const safeCurrent = typeof current === "number" ? current : 0;
        return Math.max(0, safeCurrent + delta);
      });

      setCount((previous) => Math.max(0, previous + delta));
    } catch (error) {
      console.error("Like toggle failed:", error);
      const message = error instanceof Error ? error.message : "Unable to update like.";
      alert(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button className="like-button" onClick={handleToggleLike} disabled={busy}>
      {liked ? "Unlike" : "Like"} ({count})
    </button>
  );
}

