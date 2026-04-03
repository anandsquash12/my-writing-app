"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { equalTo, get, onValue, orderByChild, push, query, ref, set, update } from "firebase/database";
import { auth, db } from "../../firebase/config";
import PostCard from "../../components/PostCard";
import UserAvatar from "../../components/ui/UserAvatar";
import { ButtonSpinner } from "../../components/ui/Loading";
import { createChat } from "../../lib/chat";
import { withAvatarVersion } from "../../lib/avatar";
import { normalizePostsMap, sortPostsNewestFirst, type PostRecord } from "../../lib/posts";

interface WriterProfileClientProps {
  writerId: string;
}

interface UserProfile {
  displayName: string;
  bio: string;
  createdAt: number;
  avatarURL: string;
  avatarUpdatedAt: number;
  isPrivateAccount: boolean;
}

export default function WriterProfileClient({ writerId }: WriterProfileClientProps) {
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<"posts" | "about">("posts");
  const [profile, setProfile] = useState<UserProfile>({
    displayName: "",
    bio: "",
    createdAt: 0,
    avatarURL: "",
    avatarUpdatedAt: 0,
    isPrivateAccount: false,
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followSaving, setFollowSaving] = useState(false);
  const [chatStarting, setChatStarting] = useState(false);

  useEffect(() => {
    const publicPostsRef = query(ref(db, "quotes"), orderByChild("visibility"), equalTo("public"));

    const unsubscribe = onValue(publicPostsRef, (snapshot) => {
      const writerPublicPosts = normalizePostsMap(snapshot.val()).filter(
        (post) =>
          post.visibility === "public" &&
          post.status === "published" &&
          (post.authorId === writerId || (!post.authorId && post.authorName.toLowerCase() === writerId.toLowerCase())),
      );

      setPosts(sortPostsNewestFirst(writerPublicPosts));
    });

    return () => unsubscribe();
  }, [writerId]);

  useEffect(() => {
    if (!writerId) {
      return;
    }

    const profileRef = ref(db, `users/${writerId}`);
    const unsubscribe = onValue(profileRef, (snapshot) => {
      const data = (snapshot.val() || {}) as Record<string, unknown>;
      setProfile({
        displayName: typeof data.displayName === "string" ? data.displayName : "",
        bio: typeof data.bio === "string" ? data.bio : "",
        createdAt: typeof data.createdAt === "number" ? data.createdAt : 0,
        avatarURL: typeof data.avatarURL === "string" ? data.avatarURL : "",
        avatarUpdatedAt: typeof data.avatarUpdatedAt === "number" ? data.avatarUpdatedAt : 0,
        isPrivateAccount: data.isPrivateAccount === true,
      });
    });
    return () => unsubscribe();
  }, [writerId]);

  useEffect(() => {
    if (!writerId) {
      setFollowerCount(0);
      setFollowingCount(0);
      return;
    }

    const followersRef = ref(db, `follows/${writerId}/followers`);
    const followingRef = ref(db, `follows/${writerId}/following`);

    const stopFollowers = onValue(followersRef, (snapshot) => {
      const data = (snapshot.val() || {}) as Record<string, unknown>;
      setFollowerCount(Object.keys(data).length);
    });

    const stopFollowing = onValue(followingRef, (snapshot) => {
      const data = (snapshot.val() || {}) as Record<string, unknown>;
      setFollowingCount(Object.keys(data).length);
    });

    return () => {
      stopFollowers();
      stopFollowing();
    };
  }, [writerId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid || !writerId || user.uid === writerId) {
      setIsFollowing(false);
      return;
    }

    const followStateRef = ref(db, `follows/${user.uid}/following/${writerId}`);
    const unsubscribe = onValue(followStateRef, (snapshot) => {
      setIsFollowing(snapshot.val() === true);
    });

    return () => unsubscribe();
  }, [user?.uid, writerId]);

  const writerName = useMemo(() => profile.displayName || posts[0]?.authorName || writerId, [posts, profile.displayName, writerId]);
  const avatarSrc = withAvatarVersion(profile.avatarURL, profile.avatarUpdatedAt);
  const isOwnProfile = Boolean(user?.uid && writerId && user.uid === writerId);
  const canViewProfilePosts = !profile.isPrivateAccount || isOwnProfile || isFollowing;

  const handleFollowToggle = async () => {
    if (!user) {
      alert("Please log in to follow writers.");
      return;
    }
    if (!writerId || user.uid === writerId || followSaving) {
      return;
    }

    try {
      setFollowSaving(true);
      const updates: Record<string, boolean | null> = {
        [`follows/${user.uid}/following/${writerId}`]: isFollowing ? null : true,
        [`follows/${writerId}/followers/${user.uid}`]: isFollowing ? null : true,
      };
      await update(ref(db), updates);

      if (!isFollowing) {
        const selfSnapshot = await get(ref(db, `users/${user.uid}`));
        const selfData = (selfSnapshot.val() || {}) as Record<string, unknown>;
        const followerName =
          (typeof selfData.displayName === "string" && selfData.displayName) || user.displayName || user.email || "Someone";
        const followNotificationRef = push(ref(db, `notifications/${writerId}`));
        await set(followNotificationRef, {
          type: "follow",
          actorId: user.uid,
          followerId: user.uid,
          followerName,
          read: false,
          createdAt: Date.now(),
        });
      }
    } catch (error) {
      console.error("Follow toggle failed:", error);
      const message = error instanceof Error ? error.message : "Failed to update follow status.";
      alert(message);
    } finally {
      setFollowSaving(false);
    }
  };

  const handleStartChat = async () => {
    if (!user?.uid || !writerId || user.uid === writerId || chatStarting) {
      if (!user?.uid) {
        alert("Please log in to start a chat.");
      }
      return;
    }

    try {
      setChatStarting(true);
      const chatId = await createChat(db, user.uid, writerId);
      window.location.href = `/chat?chatId=${encodeURIComponent(chatId)}`;
    } catch (error) {
      console.error("Chat start failed:", error);
      alert(error instanceof Error ? error.message : "Could not start chat.");
    } finally {
      setChatStarting(false);
    }
  };

  return (
    <div className="stack">
      <section className="card stack profile-header">
        <div className="profile-top-row">
          <UserAvatar name={writerName} src={avatarSrc} size="xl" />
          <div className="stack" style={{ gap: 8 }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              {writerName}
            </h1>
            {profile.bio ? (
              <p className="muted-text" style={{ margin: 0 }}>
                {profile.bio}
              </p>
            ) : null}
            {profile.isPrivateAccount ? (
              <p className="muted-text" style={{ margin: 0 }}>
                Private account
              </p>
            ) : null}
          </div>
        </div>

        <div className="profile-stats">
          <div className="profile-stat-item">
            <span className="profile-stat-value">{followerCount}</span>
            <span className="muted-text">Followers</span>
          </div>
          <div className="profile-stat-item">
            <span className="profile-stat-value">{followingCount}</span>
            <span className="muted-text">Following</span>
          </div>
          <div className="profile-stat-item">
            <span className="profile-stat-value">{posts.length}</span>
            <span className="muted-text">Total Posts</span>
          </div>
        </div>

        {isOwnProfile ? (
          <div className="mode-toggle">
            <Link href="/profile/edit" className="outline-link">
              Edit Profile
            </Link>
            <Link href="/dashboard" className="outline-link">
              Dashboard
            </Link>
          </div>
        ) : (
          <div className="mode-toggle">
            <button onClick={handleFollowToggle} disabled={followSaving} type="button" className="primary-button profile-follow-btn inline-flex items-center justify-center gap-2">
              {followSaving ? <ButtonSpinner /> : null}
              {followSaving ? "Saving..." : !user ? "Login to Follow" : isFollowing ? "Unfollow" : "Follow"}
            </button>
            <button onClick={handleStartChat} disabled={chatStarting || !user || isOwnProfile} type="button" className="secondary-button inline-flex items-center justify-center gap-2">
              {chatStarting ? <ButtonSpinner /> : null}
              {chatStarting ? "Opening..." : "Message"}
            </button>
          </div>
        )}
      </section>

      <section className="profile-tabs">
        <button
          type="button"
          onClick={() => setTab("posts")}
          className={tab === "posts" ? "profile-tab profile-tab-active" : "profile-tab"}
        >
          Posts
        </button>
        <button
          type="button"
          onClick={() => setTab("about")}
          className={tab === "about" ? "profile-tab profile-tab-active" : "profile-tab"}
        >
          About
        </button>
      </section>

      {tab === "posts" ? (
        !canViewProfilePosts ? (
          <div className="card">This account is private. Follow to see posts.</div>
        ) : posts.length === 0 ? (
          <div className="card">No posts found for this writer.</div>
        ) : (
          <section className="post-list">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} excerpt />
            ))}
          </section>
        )
      ) : (
        <section className="card stack">
          <p style={{ margin: 0 }}>
            <strong>Bio:</strong> {canViewProfilePosts ? profile.bio || "No bio added yet." : "Follow this account to view bio."}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Joined:</strong> {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Unknown"}
          </p>
        </section>
      )}
    </div>
  );
}
