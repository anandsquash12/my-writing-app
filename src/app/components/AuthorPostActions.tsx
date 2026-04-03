"use client";

import Link from "next/link";
import { get, ref, remove } from "firebase/database";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { db } from "../firebase/config";
import type { PostRecord } from "../lib/posts";

interface AuthorPostActionsProps {
  post: PostRecord;
  currentUserId: string | null | undefined;
  redirectOnDelete?: string;
}

export default function AuthorPostActions({ post, currentUserId, redirectOnDelete }: AuthorPostActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  if (!currentUserId || currentUserId !== post.authorId) {
    return null;
  }

  const handleDelete = async () => {
    if (deleting) {
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this post?");
    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      const quoteSnapshot = await get(ref(db, `quotes/${post.id}`));
      const postSnapshot = await get(ref(db, `posts/${post.id}`));
      const source = (quoteSnapshot.val() || postSnapshot.val() || {}) as { authorId?: unknown; userId?: unknown };
      const ownerId =
        typeof source.authorId === "string" ? source.authorId : typeof source.userId === "string" ? source.userId : "";

      if (ownerId !== currentUserId) {
        alert("Not authorized.");
        return;
      }

      // Delete primary content first so permission issues in cleanup do not block post deletion.
      if (quoteSnapshot.exists()) {
        await remove(ref(db, `quotes/${post.id}`));
      }

      if (postSnapshot.exists()) {
        await remove(ref(db, `posts/${post.id}`));
      }

      await Promise.allSettled([
        remove(ref(db, `comments/${post.id}`)),
        remove(ref(db, `likes/${post.id}`)),
        remove(ref(db, `reports/${post.id}`)),
      ]);

      if (redirectOnDelete) {
        router.push(redirectOnDelete);
      } else {
        router.push("/profile");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete post.";
      alert(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mode-toggle">
      <Link href={`/posts/${post.id}/edit`} className="outline-link">
        Edit
      </Link>
      <button onClick={handleDelete} type="button" className="secondary-button" disabled={deleting}>
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
