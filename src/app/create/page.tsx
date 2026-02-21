"use client";

import { useEffect, useMemo, useState } from "react";
import { db, auth } from "../firebase/config";
import { ref, push, set } from "firebase/database";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { tokenizeForSearch } from "../lib/posts";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setAuthLoading(false);
        router.replace("/login");
        return;
      }

      setUser(currentUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, [router]);

  const authorName = useMemo(() => {
    if (!user) {
      return "";
    }

    return user.displayName || user.email || "Anonymous";
  }, [user]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !user) {
      alert("Title and content are required.");
      return;
    }

    try {
      setSaving(true);
      const postsRef = ref(db, "posts");
      const newPostRef = push(postsRef);
      await set(newPostRef, {
        authorId: user.uid,
        authorName,
        title: title.trim(),
        content: content.trim(),
        createdAt: Date.now(),
        keywords: tokenizeForSearch(`${title} ${content}`),
        likeCount: 0,
      });
      router.push("/");
    } catch (error) {
      console.error("Failed to add post:", error);
      const message = error instanceof Error ? error.message : "Failed to add post.";
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return <div className="card">Checking authentication...</div>;
  }

  if (!user) {
    return <div className="card">Redirecting to login...</div>;
  }

  return (
    <div className="stack">
      <h1 className="page-title">Create New Post</h1>
      <div className="card form-stack">
        <p className="muted-text">
          Posting as: <strong>{authorName}</strong>
        </p>
        <input
          placeholder="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="input"
        />
        <textarea
          placeholder="Write your shayari..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="textarea"
        />
        <button onClick={handleSubmit} disabled={saving} className="primary-button">
          {saving ? "Saving..." : "Publish Post"}
        </button>
      </div>
    </div>
  );
}

