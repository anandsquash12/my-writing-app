"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { useRouter } from "next/navigation";
import PostCard from "../components/PostCard";
import { auth, db } from "../firebase/config";
import { normalizePostsMap, sortPostsNewestFirst, type PostRecord } from "../lib/posts";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [accessBlocked, setAccessBlocked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        setAccessBlocked(true);
        router.replace("/login");
        return;
      }

      const usesPassword = currentUser.providerData.some((provider) => provider.providerId === "password");
      if (usesPassword && !currentUser.emailVerified) {
        setLoading(false);
        setAccessBlocked(true);
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
      setPosts(sortPostsNewestFirst(myPosts));
    });

    return () => unsubscribe();
  }, [user]);

  const displayName = useMemo(() => {
    if (!user) {
      return "";
    }
    return user.displayName || user.email || "Anonymous";
  }, [user]);

  if (loading) {
    return <div className="card">Checking authentication...</div>;
  }

  if (!user) {
    return <div className="card">{accessBlocked ? "Access restricted. Redirecting..." : "Redirecting to login..."}</div>;
  }

  return (
    <div className="stack">
      <h1 className="page-title">My Profile</h1>
      <section className="card stack">
        <p>
          <strong>Name:</strong> {displayName}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Total posts:</strong> {posts.length}
        </p>
      </section>

      {posts.length === 0 ? (
        <div className="card">You have not posted yet.</div>
      ) : (
        <section className="post-list">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} excerpt />
          ))}
        </section>
      )}
    </div>
  );
}
