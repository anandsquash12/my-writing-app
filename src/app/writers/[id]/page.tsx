"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { ref, onValue } from "firebase/database";
import { useParams } from "next/navigation";

interface Post {
  title: string;
  content: string;
  userName: string;
}

export default function WriterProfile() {
  const { id: writerId } = useParams();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const postsRef = ref(db, "posts");
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
const writerPosts = data
  ? (Object.values(data) as Post[]).filter(
      (post) => post.userName === writerId
    )
  : [];
      setPosts(writerPosts.reverse());
    });
    return () => unsubscribe();
  }, [writerId]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Writer: {writerId}</h1>
      {posts.length === 0 && <p>No posts yet.</p>}
      {posts.map((post, index) => (
        <div key={index} style={{ marginTop: 20, padding: 15, border: "1px solid #ccc", borderRadius: 8 }}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </div>
      ))}
    </div>
  );
}
