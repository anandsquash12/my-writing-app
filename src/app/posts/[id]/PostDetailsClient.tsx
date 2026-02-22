"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { onValue, push, ref, set } from "firebase/database";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebase/config";
import PostCard from "../../components/PostCard";
import { normalizePost, type PostRecord } from "../../lib/posts";

interface CommentRecord {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: number;
}

function normalizeComment(commentId: string, value: unknown): CommentRecord {
  const source = (value || {}) as Record<string, unknown>;
  return {
    id: commentId,
    authorId: typeof source.authorId === "string" ? source.authorId : "",
    authorName: typeof source.authorName === "string" ? source.authorName : "Unknown",
    text: typeof source.text === "string" ? source.text : "",
    createdAt: typeof source.createdAt === "number" ? source.createdAt : 0,
  };
}

interface PostDetailsClientProps {
  postId: string;
}

export default function PostDetailsClient({ postId }: PostDetailsClientProps) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [post, setPost] = useState<PostRecord | null>(null);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const postRef = ref(db, `posts/${postId}`);
    const unsubscribe = onValue(postRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setPost(null);
        return;
      }
      setPost(normalizePost(postId, data));
    });
    return () => unsubscribe();
  }, [postId]);

  useEffect(() => {
    const commentsRef = ref(db, `comments/${postId}`);
    const unsubscribe = onValue(commentsRef, (snapshot) => {
      const data = snapshot.val() as Record<string, unknown> | null;
      if (!data) {
        setComments([]);
        return;
      }

      const normalized = Object.entries(data)
        .map(([id, value]) => normalizeComment(id, value))
        .sort((a, b) => a.createdAt - b.createdAt);

      setComments(normalized);
    });
    return () => unsubscribe();
  }, [postId]);

  const authorName = useMemo(() => {
    if (!user) {
      return "";
    }
    return user.displayName || user.email || "Anonymous";
  }, [user]);

  const handleCommentSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      alert("Please log in to comment.");
      router.push("/login");
      return;
    }

    if (!text.trim()) {
      return;
    }

    try {
      setSaving(true);
      const commentsRef = ref(db, `comments/${postId}`);
      const newCommentRef = push(commentsRef);
      await set(newCommentRef, {
        authorId: user.uid,
        authorName,
        text: text.trim(),
        createdAt: Date.now(),
      });
      setText("");
    } catch (error) {
      console.error("Comment failed:", error);
      const message = error instanceof Error ? error.message : "Failed to comment.";
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  if (!post) {
    return <div className="card">Post not found.</div>;
  }

  return (
    <div className="stack">
      <h1 className="page-title">Post Details</h1>
      <PostCard post={post} />

      <section className="card stack">
        <h2 style={{ margin: 0 }}>Comments</h2>
        {comments.length === 0 ? <p className="muted-text">No comments yet.</p> : null}
        {comments.map((comment) => (
          <article key={comment.id} className="card">
            <p style={{ margin: "0 0 8px" }}>{comment.text}</p>
            <p className="post-meta">
              {comment.authorName} - {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : "Unknown date"}
            </p>
          </article>
        ))}
      </section>

      <section className="card">
        <form onSubmit={handleCommentSubmit} className="form-stack">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="textarea"
            placeholder={user ? "Write a comment..." : "Login to add a comment"}
          />
          <button type="submit" disabled={saving} className="primary-button">
            {saving ? "Posting..." : "Add Comment"}
          </button>
        </form>
      </section>
    </div>
  );
}

