"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { onValue, ref } from "firebase/database";
import PostCard from "./PostCard";
import { normalizePostsMap, sortPostsNewestFirst, type PostRecord } from "../lib/posts";

export default function HomeFeedClient() {
  const [posts, setPosts] = useState<PostRecord[]>([]);

  useEffect(() => {
    const postsRef = ref(db, "posts");
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedPosts = normalizePostsMap(data);
      setPosts(sortPostsNewestFirst(loadedPosts));
    });

    return () => unsubscribe();
  }, []);

  return posts.length === 0 ? (
    <div className="card">No posts yet.</div>
  ) : (
    <section className="post-list">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} excerpt />
      ))}
    </section>
  );
}
