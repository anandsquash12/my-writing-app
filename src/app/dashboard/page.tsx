"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { equalTo, onValue, orderByChild, query, ref } from "firebase/database";
import { useRouter } from "next/navigation";
import { auth, db } from "../firebase/config";
import { normalizePostsMap, type PostRecord } from "../lib/posts";

interface CommentsMap {
  [postId: string]: Record<string, unknown> | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [commentsMap, setCommentsMap] = useState<CommentsMap>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        router.replace("/login");
        return;
      }

      const usesPassword = currentUser.providerData.some((provider) => provider.providerId === "password");
      if (usesPassword && !currentUser.emailVerified) {
        setLoading(false);
        router.replace("/login?reason=verify");
        return;
      }

      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, [router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    // Fetch all user's posts from /quotes (unified data source)
    const postsRef = query(ref(db, "quotes"), orderByChild("authorId"), equalTo(user.uid));
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      const userPosts = normalizePostsMap(data);
      console.log("📊 [DASHBOARD] LOADED USER POSTS FROM /quotes:", {
        count: userPosts.length,
        posts: userPosts.map(p => ({ id: p.id, title: p.title, status: p.status })),
      });
      setPosts(userPosts);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const commentsRef = ref(db, "comments");
    const unsubscribe = onValue(commentsRef, (snapshot) => {
      setCommentsMap((snapshot.val() || {}) as CommentsMap);
    });

    return () => unsubscribe();
  }, [user]);

  const stats = useMemo(() => {
    const totalPosts = posts.length;
    const totalDrafts = posts.filter((post) => post.status === "draft").length;
    const totalPrivatePosts = posts.filter((post) => post.visibility === "private").length;
    const totalLikes = posts.reduce((sum, post) => sum + Math.max(0, post.likeCount || 0), 0);
    const totalViews = posts.reduce((sum, post) => sum + Math.max(0, post.viewCount || 0), 0);
    const myPostIds = new Set(posts.map((post) => post.id));
    const totalComments = Object.entries(commentsMap).reduce((sum, [postId, commentEntries]) => {
      if (!myPostIds.has(postId) || !commentEntries) {
        return sum;
      }
      return sum + Object.keys(commentEntries).length;
    }, 0);

    return { totalPosts, totalDrafts, totalPrivatePosts, totalLikes, totalViews, totalComments };
  }, [posts, commentsMap]);

  if (loading) {
    return <div className="card">Loading dashboard...</div>;
  }

  if (!user) {
    return <div className="card">Redirecting to login...</div>;
  }

  return (
    <div className="stack">
      <h1 className="page-title">Writer Dashboard</h1>

      <section className="dashboard-grid">
        <article className="card">
          <p className="muted-text">Total Posts</p>
          <h2 className="stat-value">{stats.totalPosts}</h2>
        </article>
        <article className="card">
          <p className="muted-text">Total Drafts</p>
          <h2 className="stat-value">{stats.totalDrafts}</h2>
        </article>
        <article className="card">
          <p className="muted-text">Total Private Posts</p>
          <h2 className="stat-value">{stats.totalPrivatePosts}</h2>
        </article>
        <article className="card">
          <p className="muted-text">Total Likes Received</p>
          <h2 className="stat-value">{stats.totalLikes}</h2>
        </article>
        <article className="card">
          <p className="muted-text">Total Views Received</p>
          <h2 className="stat-value">{stats.totalViews}</h2>
        </article>
        <article className="card">
          <p className="muted-text">Total Comments Received</p>
          <h2 className="stat-value">{stats.totalComments}</h2>
        </article>
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Activity Summary</h3>
        <p className="muted-text" style={{ marginBottom: 0 }}>
          You have {stats.totalPosts} total post{stats.totalPosts === 1 ? "" : "s"}, including {stats.totalDrafts} draft
          {stats.totalDrafts === 1 ? "" : "s"} and {stats.totalPrivatePosts} private post
          {stats.totalPrivatePosts === 1 ? "" : "s"}, with {stats.totalLikes} like{stats.totalLikes === 1 ? "" : "s"},
          {stats.totalViews} view{stats.totalViews === 1 ? "" : "s"}, and {stats.totalComments} comment
          {stats.totalComments === 1 ? "" : "s"} received.
        </p>
      </section>
    </div>
  );
}
