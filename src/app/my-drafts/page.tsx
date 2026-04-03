"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { equalTo, onValue, orderByChild, query, ref } from "firebase/database";
import { useRouter } from "next/navigation";
import AuthorPostActions from "../components/AuthorPostActions";
import PostCard from "../components/PostCard";
import { auth, db } from "../firebase/config";
import { normalizePostsMap, sortPostsNewestFirst, type PostRecord } from "../lib/posts";

export default function MyDraftsPage() {
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

    // Fetch all posts for current user from /quotes (unified data source)
    const ownPostsRef = query(ref(db, "quotes"), orderByChild("authorId"), equalTo(user.uid));
    const unsubscribe = onValue(ownPostsRef, (snapshot) => {
      const ownDrafts = normalizePostsMap(snapshot.val()).filter((post) => post.status === "draft");
      console.log("📝 [MY DRAFTS] LOADED FROM /quotes:", {
        count: ownDrafts.length,
        drafts: ownDrafts.map(p => ({ id: p.id, title: p.title })),
      });
      setPosts(sortPostsNewestFirst(ownDrafts));
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <div className="card">Loading drafts...</div>;
  }

  if (!user) {
    return <div className="card">Redirecting to login...</div>;
  }

  return (
    <div className="stack">
      <h1 className="page-title">My Drafts</h1>
      {posts.length === 0 ? (
        <div className="card">No drafts yet.</div>
      ) : (
        <section className="post-list">
          {posts.map((post) => (
            <div key={post.id} className="stack">
              <PostCard post={post} excerpt />
              <AuthorPostActions post={post} currentUserId={user.uid} />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
