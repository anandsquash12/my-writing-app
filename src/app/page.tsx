"use client";

import { useEffect, useState } from "react";
import { db } from "./firebase/config";
import { ref, onValue } from "firebase/database";

interface Post {
  title: string;
  content: string;
  userName: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const postsRef = ref(db, "posts");
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedPosts: Post[] = data ? Object.values(data) : [];
      setPosts(loadedPosts.reverse()); // reset state, avoid duplicates
    });
    return () => unsubscribe();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Home Feed</h1>
      {posts.length === 0 && <p>No posts yet.</p>}
      {posts.map((post, index) => (
        <div key={index} style={{ marginTop: 20, padding: 15, border: "1px solid #ccc", borderRadius: 8 }}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
          <small>By: {post.userName}</small>
        </div>
      ))}
    </div>
  );
}
