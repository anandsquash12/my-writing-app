"use client";

import { useEffect, useState } from "react";
import { equalTo, onValue, orderByChild, query, ref } from "firebase/database";
import PostCard from "../components/PostCard";
import { db } from "../firebase/config";
import { normalizePostsMap, sortPostsNewestFirst, type PostRecord } from "../lib/posts";

export default function ConfessionsFeedClient() {
  const [posts, setPosts] = useState<PostRecord[]>([]);

  useEffect(() => {
    // Fetch anonymous posts from /quotes (unified data source)
    const confessionsRef = query(ref(db, "quotes"), orderByChild("isAnonymous"), equalTo(true));
    const unsubscribe = onValue(confessionsRef, (snapshot) => {
      const filtered = normalizePostsMap(snapshot.val()).filter(
        (post) => post.visibility === "public" && post.status === "published" && post.isAnonymous,
      );
      console.log("🎭 [CONFESSIONS] LOADED FROM /quotes:", {
        count: filtered.length,
      });
      setPosts(sortPostsNewestFirst(filtered));
    });
    return () => unsubscribe();
  }, []);

  return posts.length === 0 ? (
    <div className="card">No confessions yet.</div>
  ) : (
    <section className="post-list">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} excerpt />
      ))}
    </section>
  );
}
