"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { onValue, ref } from "firebase/database";
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
  const [commentTotal, setCommentTotal] = useState(0);

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

    const postsRef = ref(db, "posts");
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      const allPosts = normalizePostsMap(data);
      const myPosts = allPosts.filter((post) => {
        if (post.authorId) {
          return post.authorId === user.uid;
        }
        const fallbackNames = [user.displayName?.toLowerCase(), user.email?.toLowerCase()].filter(Boolean);
        return fallbackNames.includes(post.authorName.toLowerCase());
      });
      setPosts(myPosts);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const commentsRef = ref(db, "comments");
    const unsubscribe = onValue(commentsRef, (snapshot) => {
      const data = (snapshot.val() || {}) as CommentsMap;
      const myPostIds = new Set(posts.map((post) => post.id));

      let total = 0;
      Object.entries(data).forEach(([postId, commentEntries]) => {
        if (!myPostIds.has(postId) || !commentEntries) {
          return;
        }
        total += Object.keys(commentEntries).length;
      });

      setCommentTotal(total);
    });

    return () => unsubscribe();
  }, [posts, user]);

  const stats = useMemo(() => {
    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, post) => sum + Math.max(0, post.likeCount || 0), 0);
    return { totalPosts, totalLikes };
  }, [posts]);

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
          <p className="muted-text">Total Likes Received</p>
          <h2 className="stat-value">{stats.totalLikes}</h2>
        </article>
        <article className="card">
          <p className="muted-text">Total Comments Received</p>
          <h2 className="stat-value">{commentTotal}</h2>
        </article>
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Activity Summary</h3>
        <p className="muted-text" style={{ marginBottom: 0 }}>
          You have published {stats.totalPosts} post{stats.totalPosts === 1 ? "" : "s"}, earned {stats.totalLikes} like
          {stats.totalLikes === 1 ? "" : "s"}, and received {commentTotal} comment{commentTotal === 1 ? "" : "s"}.
        </p>
      </section>
    </div>
  );
}
