"use client";

import Link from "next/link";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { get, onValue, ref } from "firebase/database";
import AuthorQuoteActions from "../components/AuthorQuoteActions";
import InstagramPostCard from "../components/InstagramPostCard";
import PremiumPostCard from "../components/PremiumPostCard";
import { ProfileShimmer } from "../components/ui/Loading";
import UserAvatar from "../components/ui/UserAvatar";
import { uploadAndSaveAvatar } from "@/lib/avatarUpload";
import { useAuth } from "../context/AuthContext";
import { database } from "../firebase/config";
import { withAvatarVersion } from "../lib/avatar";
import { type QuoteRecord, normalizeQuotesMap } from "../lib/quotes";
import { type PremiumPost, normalizePremiumPostsMap } from "../lib/premiumPosts";
import { type Purchase, normalizePurchasesMap } from "../lib/purchases";
import EarningsTab from "../components/EarningsTab";

interface ProfileInfo {
  bio: string;
  createdAt: number;
}

interface PurchaseWithPost extends Purchase {
  post?: PremiumPost;
}

export default function ProfilePage() {
  const { user, loading, profile } = useAuth();
  const [posts, setPosts] = useState<QuoteRecord[]>([]);
  const [premiumPosts, setPremiumPosts] = useState<PremiumPost[]>([]);
  const [allPurchases, setAllPurchases] = useState<Purchase[]>([]);
  const [purchases, setPurchases] = useState<PurchaseWithPost[]>([]);
  const [creatorSales, setCreatorSales] = useState<PurchaseWithPost[]>([]);
  const [info, setInfo] = useState<ProfileInfo>({ bio: "", createdAt: 0 });
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [tab, setTab] = useState<"posts" | "premium" | "purchases" | "earnings">("posts");
  const [uploading, setUploading] = useState(false);
  const [uploadErrorMessage, setUploadErrorMessage] = useState("");
  const [pendingRetryFile, setPendingRetryFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user?.uid || !database) {
      setPosts([]);
      setPremiumPosts([]);
      setPurchases([]);
      setInfo({ bio: "", createdAt: 0 });
      setFollowerCount(0);
      setFollowingCount(0);
      return;
    }

    const postsRef = ref(database, "quotes");
    const stopPosts = onValue(postsRef, (snapshot) => {
      const allQuotes = normalizeQuotesMap(snapshot.val());
      const myPosts = allQuotes.filter((post) => post.authorId === user.uid).sort((a, b) => b.createdAt - a.createdAt);
      setPosts(myPosts);
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
      const allPremium = normalizePremiumPostsMap(snapshot.val());
      setPremiumPosts(allPremium.filter((post) => post.userId === user.uid));
    });

    const purchasesRef = ref(database, "purchases");
    const stopPurchases = onValue(purchasesRef, async (snapshot) => {
      const allPurchasesMap = normalizePurchasesMap(snapshot.val());
      setAllPurchases(allPurchasesMap);

      const userPurchases = allPurchasesMap.filter((purchase) => purchase.userId === user.uid);
      const purchasesWithPosts = await Promise.all(
        userPurchases.map(async (purchase) => {
          try {
            const postSnapshot = await get(ref(database, `premiumPosts/${purchase.postId}`));
            const post = postSnapshot.exists() ? normalizePremiumPostsMap({ [purchase.postId]: postSnapshot.val() })[0] : undefined;
            return { ...purchase, post };
          } catch {
            return purchase;
          }
        }),
      );

      setPurchases(purchasesWithPosts.sort((a, b) => b.createdAt - a.createdAt));
    });

    return () => {
      stopPosts();
      stopProfile();
      stopFollowers();
      stopFollowing();
      stopPremiumPosts();
      stopPurchases();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setCreatorSales([]);
      return;
    }

    const postById = new Map(premiumPosts.map((post) => [post.id, post]));
    const creatorSalesWithPost = allPurchases
      .filter((purchase) => purchase.creatorId === user.uid || postById.get(purchase.postId)?.userId === user.uid)
      .map((purchase) => ({ ...purchase, post: postById.get(purchase.postId) }))
      .sort((a, b) => b.createdAt - a.createdAt);

    setCreatorSales(creatorSalesWithPost);
  }, [allPurchases, premiumPosts, user?.uid]);

  const displayName = profile.displayName || user?.displayName || "User";
  const displayedAvatar = withAvatarVersion(profile.avatarURL, profile.avatarUpdatedAt);
  const totalLikesReceived = useMemo(
    () => posts.reduce((sum, post) => sum + (post.likeCount || 0), 0) + premiumPosts.reduce((sum, post) => sum + (post.likeCount || 0), 0),
    [posts, premiumPosts],
  );
  const joinedDate = info.createdAt ? new Date(info.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" }) : "Recently";

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
    <div className="space-y-6">
      <section className="rounded-[34px] border border-white/10 bg-[#121218]/95 p-6 shadow-2xl md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <UserAvatar name={displayName} src={displayedAvatar} size="xl" />
              <div className="space-y-2">
                <p className="hero-tag">Creator profile</p>
                <h1 className="serif-display text-5xl text-[#f5efe2]">{displayName}</h1>
                <p className="max-w-2xl text-sm leading-7 text-[#c8beae]">
                  {info.bio || "Writers who publish consistently build trust faster. Add a bio to turn profile visits into followers and unlocks."}
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-[#a99f90]">Member since {joinedDate}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#a99f90]">Followers</p>
                <p className="mt-2 text-3xl font-semibold text-[#f5efe2]">{followerCount}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#a99f90]">Following</p>
                <p className="mt-2 text-3xl font-semibold text-[#f5efe2]">{followingCount}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#a99f90]">Total posts</p>
                <p className="mt-2 text-3xl font-semibold text-[#f5efe2]">{posts.length + premiumPosts.length}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#a99f90]">Likes received</p>
                <p className="mt-2 text-3xl font-semibold text-[#f0c18d]">{totalLikesReceived}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/profile/edit" className="primary-button">
                Edit Profile
              </Link>
              <Link href="/publish" className="outline-link">
                Start Writing
              </Link>
              <Link href="/vault/create" className="outline-link">
                Create Vault Post
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <label className="text-xs uppercase tracking-[0.16em] text-[#a99f90]" htmlFor="avatar-input">
              Profile avatar
            </label>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={uploading}
              className="mt-4 block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#ece3d4]"
            />
            <p className="mt-3 text-sm text-[#b8ae9f]">{uploading ? "Uploading avatar..." : "Upload or refresh your author photo for better trust."}</p>
            {uploadErrorMessage ? <p className="mt-3 text-sm text-[#ffb7b7]">{uploadErrorMessage}</p> : null}
            {pendingRetryFile && !uploading ? (
              <button type="button" className="outline-link mt-4" onClick={() => void uploadAvatar(pendingRetryFile)}>
                Retry Upload
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setTab("posts")} className={tab === "posts" ? "profile-tab profile-tab-active" : "profile-tab"}>
          Posts
        </button>
        <button type="button" onClick={() => setTab("premium")} className={tab === "premium" ? "profile-tab profile-tab-active" : "profile-tab"}>
          Premium
        </button>
        <button type="button" onClick={() => setTab("purchases")} className={tab === "purchases" ? "profile-tab profile-tab-active" : "profile-tab"}>
          Purchases
        </button>
        <button type="button" onClick={() => setTab("earnings")} className={tab === "earnings" ? "profile-tab profile-tab-active" : "profile-tab"}>
          Earnings
        </button>
      </section>

      {tab === "posts" ? (
        posts.length === 0 ? (
          <div className="rounded-[30px] border border-dashed border-white/10 bg-[#121218]/90 p-10 text-center">
            <p className="serif-display text-3xl text-[#f3ead9]">No posts yet</p>
            <p className="mt-2 text-sm text-[#a89f90]">Start writing your first piece to build your public presence.</p>
            <Link href="/create" className="outline-link mt-6">
              Start Writing
            </Link>
          </div>
        ) : (
          <section className="space-y-5">
            {posts.map((post) => (
              <div key={post.id} className="space-y-3">
                <InstagramPostCard post={post} />
                <AuthorQuoteActions post={post} currentUserId={user.uid} />
              </div>
            ))}
          </section>
        )
      ) : tab === "premium" ? (
        premiumPosts.length === 0 ? (
          <div className="rounded-[30px] border border-dashed border-white/10 bg-[#121218]/90 p-10 text-center">
            <p className="serif-display text-3xl text-[#f3ead9]">No premium posts yet</p>
            <p className="mt-2 text-sm text-[#a89f90]">Create your first Vault post and start earning from your best writing.</p>
            <Link href="/vault/create" className="outline-link mt-6">
              Create Vault Post
            </Link>
          </div>
        ) : (
          <section className="premium-grid md:grid-cols-2">
            {premiumPosts.map((post) => (
              <PremiumPostCard key={post.id} post={post} hideAuthor />
            ))}
          </section>
        )
      ) : tab === "earnings" ? (
        <EarningsTab />
      ) : purchases.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-white/10 bg-[#121218]/90 p-10 text-center">
          <p className="serif-display text-3xl text-[#f3ead9]">No purchases yet</p>
          <p className="mt-2 text-sm text-[#a89f90]">Browse the Writers Vault to unlock premium poetry, stories, and lyrics.</p>
          <Link href="/vault" className="outline-link mt-6">
            Explore Writers Vault
          </Link>
        </div>
      ) : (
        <section className="space-y-4">
          {purchases.map((purchase) => {
            if (!purchase.post) {
              return null;
            }

            return (
              <Link key={purchase.id} href={`/vault/${purchase.post.id}`} className="rounded-[28px] border border-white/10 bg-[#121218]/92 p-5 shadow-xl transition hover:-translate-y-0.5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  {purchase.post.imageUrl ? (
                    <div className="h-28 w-full overflow-hidden rounded-[20px] bg-white/5 md:w-40">
                      <img src={purchase.post.imageUrl} alt={purchase.post.title} className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#a99f90]">Purchased {new Date(purchase.createdAt).toLocaleDateString("en-IN")}</p>
                    <h3 className="serif-display mt-2 text-3xl text-[#f5efe2]">{purchase.post.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[#cfc6b6]">{purchase.post.previewText}</p>
                  </div>
                  <div className="rounded-full border border-[#9ddeaf]/20 bg-[#9ddeaf]/10 px-4 py-2 text-sm font-semibold text-[#dff5e3]">
                    Unlocked
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
