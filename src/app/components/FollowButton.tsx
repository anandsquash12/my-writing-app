"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { onValue, ref, remove, set } from "firebase/database";
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../firebase/config";

interface FollowButtonProps {
  targetUserId: string;
}

export default function FollowButton({ targetUserId }: FollowButtonProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!targetUserId) {
      return;
    }

    const stopFollowers = onValue(ref(db, `follows/${targetUserId}/followers`), (snapshot) => {
      const data = (snapshot.val() || {}) as Record<string, boolean>;
      setFollowersCount(Object.keys(data).length);
    });

    const stopFollowing = onValue(ref(db, `follows/${targetUserId}/following`), (snapshot) => {
      const data = (snapshot.val() || {}) as Record<string, boolean>;
      setFollowingCount(Object.keys(data).length);
    });

    return () => {
      stopFollowers();
      stopFollowing();
    };
  }, [targetUserId]);

  useEffect(() => {
    if (!user?.uid || !targetUserId || user.uid === targetUserId) {
      setIsFollowing(false);
      return;
    }

    const unsubscribe = onValue(ref(db, `follows/${user.uid}/following/${targetUserId}`), (snapshot) => {
      setIsFollowing(snapshot.val() === true);
    });

    return () => unsubscribe();
  }, [targetUserId, user?.uid]);

  const isOwnProfile = useMemo(() => Boolean(user?.uid && user.uid === targetUserId), [targetUserId, user?.uid]);

  const handleFollow = async () => {
    if (!user?.uid || saving || isOwnProfile) {
      if (!user?.uid) {
        alert("Please log in to follow users.");
      }
      return;
    }

    try {
      setSaving(true);
      await set(ref(db, `follows/${user.uid}/following/${targetUserId}`), true);
      await set(ref(db, `follows/${targetUserId}/followers/${user.uid}`), true);
    } catch (error) {
      console.error("Follow failed:", error);
      alert("Failed to follow user.");
    } finally {
      setSaving(false);
    }
  };

  const handleUnfollow = async () => {
    if (!user?.uid || saving || isOwnProfile) {
      return;
    }

    try {
      setSaving(true);
      await remove(ref(db, `follows/${user.uid}/following/${targetUserId}`));
      await remove(ref(db, `follows/${targetUserId}/followers/${user.uid}`));
    } catch (error) {
      console.error("Unfollow failed:", error);
      alert("Failed to unfollow user.");
    } finally {
      setSaving(false);
    }
  };

  if (isOwnProfile) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
        <span>{followersCount} followers</span>
        <span>{followingCount} following</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={isFollowing ? handleUnfollow : handleFollow}
        disabled={saving}
        className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
      >
        {saving ? "Saving..." : isFollowing ? "➕ Unfollow" : "➕ Follow"}
      </button>
      <span className="text-sm text-neutral-600">{followersCount} followers</span>
      <span className="text-sm text-neutral-600">{followingCount} following</span>
    </div>
  );
}
