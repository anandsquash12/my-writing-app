"use client";

import Link from "next/link";
import { get, ref, remove } from "firebase/database";
import { useRouter } from "next/navigation";
import { db } from "../firebase/config";
import { type QuoteRecord } from "../lib/quotes";
import { useState } from "react";

interface AuthorQuoteActionsProps {
  post: QuoteRecord;
  currentUserId: string | null | undefined;
  redirectOnDelete?: string;
}

export default function AuthorQuoteActions({ post, currentUserId, redirectOnDelete }: AuthorQuoteActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  if (!currentUserId || currentUserId !== post.authorId) {
    return null;
  }

  const handleDelete = async () => {
    if (deleting) {
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this quote?");
    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      const quoteSnapshot = await get(ref(db, `quotes/${post.id}`));
      if (!quoteSnapshot.exists()) {
        alert("Quote not found.");
        return;
      }

      const source = (quoteSnapshot.val() || {}) as { authorId?: unknown };
      if (source.authorId !== currentUserId) {
        alert("Not authorized.");
        return;
      }

      await remove(ref(db, `quotes/${post.id}`));

      const postSnapshot = await get(ref(db, `posts/${post.id}`));
      if (postSnapshot.exists()) {
        await remove(ref(db, `posts/${post.id}`));
      }

      await Promise.allSettled([
        remove(ref(db, `comments/${post.id}`)),
        remove(ref(db, `likes/${post.id}`)),
        remove(ref(db, `reports/${post.id}`)),
      ]);

      alert("Quote deleted.");
      if (redirectOnDelete) {
        router.push(redirectOnDelete);
      } else {
        router.push("/profile");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete quote.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex gap-2 justify-end">
      <Link
        href={`/quotes/${post.id}/edit`}
        className="text-sm text-blue-600 hover:text-blue-800 underline"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="text-sm text-red-600 hover:text-red-800 underline disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
