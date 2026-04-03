"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { equalTo, onValue, orderByChild, query, ref } from "firebase/database";
import { useRouter } from "next/navigation";
import PostCard from "../components/PostCard";
import { auth, db } from "../firebase/config";
import { normalizePostsMap, sortPostsNewestFirst, type PostRecord } from "../lib/posts";

export default function MyPrivatePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostRecord[]>([]);

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

    // Fetch private posts from /quotes (unified data source)
    const ownPostsRef = query(ref(db, "quotes"), orderByChild("authorId"), equalTo(user.uid));
    const unsubscribe = onValue(ownPostsRef, (snapshot) => {
      const ownPrivatePosts = normalizePostsMap(snapshot.val()).filter((post) => post.visibility === "private");
      console.log("🔒 [MY PRIVATE] LOADED FROM /quotes:", {
        count: ownPrivatePosts.length,
        posts: ownPrivatePosts.map(p => ({ id: p.id, title: p.title })),
      });
      setPosts(sortPostsNewestFirst(ownPrivatePosts));
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <div className="card">Loading private posts...</div>;
  }

  if (!user) {
    return <div className="card">Redirecting to login...</div>;
  }

  return (
    <div className="stack">
      <h1 className="page-title">My Private Posts</h1>
      {posts.length === 0 ? (
        <div className="card">No private posts yet.</div>
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
