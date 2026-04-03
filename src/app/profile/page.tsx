"use client";

import Link from "next/link";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import AuthorQuoteActions from "../components/AuthorQuoteActions";
import InstagramPostCard from "../components/InstagramPostCard";
import PremiumPostCard from "../components/PremiumPostCard";
import { ProfileShimmer } from "../components/ui/Loading";
import UserAvatar from "../components/ui/UserAvatar";
import { uploadAndSaveAvatar } from "@/lib/avatarUpload";
import { useAuth } from "../context/AuthContext";
import { database } from "../firebase/config";
import { withAvatarVersion } from "../lib/avatar";
import { QuoteRecord, normalizeQuotesMap } from "../lib/quotes";
import { type PremiumPost, normalizePremiumPostsMap } from "../lib/premiumPosts";

interface ProfileInfo {
  bio: string;
  createdAt: number;
}

export default function ProfilePage() {
  const { user, loading, profile } = useAuth();
  const [posts, setPosts] = useState<QuoteRecord[]>([]);
  const [premiumPosts, setPremiumPosts] = useState<PremiumPost[]>([]);
  const [info, setInfo] = useState<ProfileInfo>({ bio: "", createdAt: 0 });
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [tab, setTab] = useState<"posts" | "premium" | "about">("posts");
  const [uploading, setUploading] = useState(false);
  const [uploadErrorMessage, setUploadErrorMessage] = useState("");
  const [pendingRetryFile, setPendingRetryFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setPosts([]);
      setInfo({ bio: "", createdAt: 0 });
      setFollowerCount(0);
      setFollowingCount(0);
      return;
    }

    const postsRef = ref(database, "quotes");
    const stopPosts = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allQuotes = normalizeQuotesMap(data);
        const myPosts = allQuotes.filter((post) => post.authorId === user.uid);
        setPosts(myPosts.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setPosts([]);
      }
    });

    const userRef = ref(database, `users/${user.uid}`);
    const stopProfile = onValue(userRef, (snapshot) => {
      const data = (snapshot.val() || {}) as Record<string, unknown>;
      setInfo({
        bio: typeof data.bio === "string" ? data.bio : "",
        createdAt: typeof data.createdAt === "number" ? data.createdAt : 0,
      });
    });

    const followersRef = ref(database, `follows/${user.uid}/followers`);
    const followingRef = ref(database, `follows/${user.uid}/following`);

    const stopFollowers = onValue(followersRef, (snapshot) => {
      const data = (snapshot.val() || {}) as Record<string, unknown>;
      setFollowerCount(Object.keys(data).length);
    });

    const stopFollowing = onValue(followingRef, (snapshot) => {
      const data = (snapshot.val() || {}) as Record<string, unknown>;
      setFollowingCount(Object.keys(data).length);
    });

    const premiumPostsRef = ref(database, "premiumPosts");
    const stopPremiumPosts = onValue(premiumPostsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allPremium = normalizePremiumPostsMap(data);
        const myPremium = allPremium.filter((post) => post.userId === user.uid);
        setPremiumPosts(myPremium.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setPremiumPosts([]);
      }
    });

    return () => {
      stopPosts();
      stopProfile();
      stopFollowers();
      stopFollowing();
      stopPremiumPosts();
    };
  }, [user?.uid]);

  const displayName = profile.displayName || user?.displayName || "User";
  const displayedAvatar = withAvatarVersion(profile.avatarURL, profile.avatarUpdatedAt);
  const publicPublishedPosts = useMemo(() => posts.filter((post) => post.visibility === "public"), [posts]);

  const uploadAvatar = async (file: File) => {
    if (!user?.uid) {
      return;
    }

    try {
      setUploading(true);
      setUploadErrorMessage("");
      await uploadAndSaveAvatar(user.uid, file);
      setPendingRetryFile(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload avatar.";
      setUploadErrorMessage(message);
      setPendingRetryFile(file);
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.uid) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    event.target.value = "";
    await uploadAvatar(file);
  };

  if (loading) {
    return <ProfileShimmer />;
  }

  if (!user) {
    return <div className="card">Redirecting to login...</div>;
  }

  return (
    <div className="stack">
      <section className="card stack profile-header">
        <div className="profile-top-row">
          <UserAvatar name={displayName} src={displayedAvatar} size="xl" />
          <div className="stack" style={{ gap: 8 }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              {displayName}
            </h1>
            {info.bio ? (
              <p className="muted-text" style={{ margin: 0 }}>
                {info.bio}
              </p>
            ) : (
              <Link href="/profile/edit" className="outline-link">
                Add bio
              </Link>
            )}
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

        <div className="mode-toggle">
          <Link href="/profile/edit" className="outline-link">
            Edit Profile
          </Link>
          <Link href="/dashboard" className="outline-link">
            Dashboard
          </Link>
          <Link href="/chat" className="outline-link">
            Messages
          </Link>
        </div>
      </section>

      <section className="card stack">
        <label className="muted-text" htmlFor="avatar-input">
          Profile Avatar
        </label>
        <input id="avatar-input" type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploading} />
        <p className="muted-text" style={{ margin: 0 }}>
          {uploading ? "Uploading avatar..." : "Upload or replace your avatar"}
        </p>
        {uploadErrorMessage ? (
          <p className="muted-text" style={{ margin: 0 }}>
            {uploadErrorMessage}
          </p>
        ) : null}
        {pendingRetryFile && !uploading ? (
          <button type="button" className="outline-link" onClick={() => void uploadAvatar(pendingRetryFile)}>
            Retry upload
          </button>
        ) : null}
      </section>

      <section className="profile-tabs">
        <button
          type="button"
          onClick={() => setTab("posts")}
          className={tab === "posts" ? "profile-tab profile-tab-active" : "profile-tab"}
        >
          Posts
        </button>
        {premiumPosts.length > 0 && (
          <button
            type="button"
            onClick={() => setTab("premium")}
            className={tab === "premium" ? "profile-tab profile-tab-active" : "profile-tab"}
          >
            Premium ({premiumPosts.length})
          </button>
        )}
        <button
          type="button"
          onClick={() => setTab("about")}
          className={tab === "about" ? "profile-tab profile-tab-active" : "profile-tab"}
        >
          About
        </button>
      </section>

      {tab === "posts" ? (
        posts.length === 0 ? (
          <div className="card">You have not posted yet.</div>
        ) : (
          <section className="post-list">
            {posts.map((post) => (
              <div key={post.id} className="stack">
                <InstagramPostCard post={post} />
                <AuthorQuoteActions post={post} currentUserId={user.uid} />
              </div>
            ))}
          </section>
        )
      ) : tab === "premium" ? (
        premiumPosts.length === 0 ? (
          <div className="card stack">
            <p>You have not created any premium posts yet.</p>
            <Link href="/vault/create" className="outline-link">
              Create your first premium post
            </Link>
          </div>
        ) : (
          <section className="post-list">
            <div className="grid gap-4">
              {premiumPosts.map((post) => (
                <PremiumPostCard key={post.id} post={post} hideAuthor />
              ))}
            </div>
          </section>
        )
      ) : (
        <section className="card stack">
          <p style={{ margin: 0 }}>
            <strong>Bio:</strong> {info.bio || "No bio yet."}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Joined:</strong> {info.createdAt ? new Date(info.createdAt).toLocaleDateString() : "Unknown"}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Public Posts:</strong> {publicPublishedPosts.length}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Premium Posts:</strong> {premiumPosts.length}
          </p>
        </section>
      )}
    </div>
  );
}
