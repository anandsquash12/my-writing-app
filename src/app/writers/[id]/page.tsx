"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase/config";
import { ref, onValue } from "firebase/database";
import { useParams } from "next/navigation";
import PostCard from "../../components/PostCard";
import { normalizePostsMap, sortPostsNewestFirst, type PostRecord } from "../../lib/posts";

export default function WriterProfile() {
  const params = useParams<{ id: string }>();
  const writerId = decodeURIComponent(params.id || "");
  const [posts, setPosts] = useState<PostRecord[]>([]);

  useEffect(() => {
    const postsRef = ref(db, "posts");
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      const allPosts = normalizePostsMap(data);
      const writerPosts = allPosts.filter((post) => {
        return post.authorId === writerId || (!post.authorId && post.authorName.toLowerCase() === writerId.toLowerCase());
      });
      setPosts(sortPostsNewestFirst(writerPosts));
    });

    return () => unsubscribe();
  }, [writerId]);

  const writerName = useMemo(() => {
    return posts[0]?.authorName || writerId;
  }, [posts, writerId]);

  return (
    <div className="stack">
      <h1 className="page-title">Writer: {writerName}</h1>
      <p className="muted-text">Author ID: {writerId}</p>
      {posts.length === 0 ? (
        <div className="card">No posts found for this writer.</div>
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

