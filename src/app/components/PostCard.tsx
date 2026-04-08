"use client";

import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { get, onValue, push, ref, remove, set } from "firebase/database";
import { useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../firebase/config";
import { withAvatarVersion } from "../lib/avatar";
import { createNotification } from "../lib/notifications";
import type { PostRecord } from "../lib/posts";
import LikeButton from "./LikeButton";
import { ButtonSpinner } from "./ui/Loading";
import UserAvatar from "./ui/UserAvatar";

interface PostCardProps {
  post: PostRecord;
  excerpt?: boolean;
  hideContent?: boolean;
  hideSupportButton?: boolean;
}

interface CommentRecord {
  id: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: number;
}

interface UserProfile {
  avatarURL: string;
  avatarUpdatedAt: number;
}

function formatDate(value: number): string {
  if (!value) {
    return "Unknown date";
  }

  return new Date(value).toLocaleString();
}

function toPlainText(content: string): string {
  return content.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function getExcerpt(content: string): string {
  const plainText = toPlainText(content);
  if (plainText.length <= 180) {
    return plainText;
  }

  return `${plainText.slice(0, 180).trimEnd()}...`;
}

function normalizeComments(data: Record<string, unknown> | null | undefined): CommentRecord[] {
  if (!data) {
    return [];
  }

  return Object.entries(data)
    .map(([id, value]) => {
      const source = (value || {}) as Record<string, unknown>;

      return {
        id,
        text: typeof source.text === "string" ? source.text : "",
        userId: typeof source.userId === "string" ? source.userId : "",
        userName: typeof source.userName === "string" ? source.userName : "User",
        createdAt: typeof source.createdAt === "number" ? source.createdAt : 0,
      };
    })
    .filter((comment) => comment.text.trim().length > 0)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export default function PostCard({
  post,
  excerpt = false,
  hideContent = false,
  hideSupportButton = false,
}: PostCardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authorProfile, setAuthorProfile] = useState<UserProfile>({
    avatarURL: "",
    avatarUpdatedAt: 0,
  });
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayAuthorName = post.isAnonymous ? "Anonymous Writer" : post.authorName || "Unknown writer";
  const postHref = `/posts/${post.id}`;
  const commentsEnabled = !post.isAnonymous && post.visibility === "public" && post.status === "published";
  const canDelete = Boolean(user?.uid) && user.uid === post.authorId;

  const previewText = useMemo(() => {
    if (hideContent) {
      return "";
    }

    return excerpt ? getExcerpt(post.content) : toPlainText(post.content);
  }, [excerpt, hideContent, post.content]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!post.authorId || post.isAnonymous) {
      setAuthorProfile({ avatarURL: "", avatarUpdatedAt: 0 });
      return;
    }

    const unsubscribe = onValue(
      ref(db, `users/${post.authorId}`),
      (snapshot) => {
        const source = (snapshot.val() || {}) as Record<string, unknown>;
        setAuthorProfile({
          avatarURL: typeof source.avatarURL === "string" ? source.avatarURL : "",
          avatarUpdatedAt: typeof source.avatarUpdatedAt === "number" ? source.avatarUpdatedAt : 0,
        });
      },
      () => {
        setAuthorProfile({ avatarURL: "", avatarUpdatedAt: 0 });
      },
    );

    return () => unsubscribe();
  }, [post.authorId, post.isAnonymous]);

  useEffect(() => {
    const unsubscribe = onValue(
      ref(db, `comments/${post.id}`),
      (snapshot) => {
        setComments(normalizeComments(snapshot.val() as Record<string, unknown> | null));
      },
      () => {
        setComments([]);
      },
    );

    return () => unsubscribe();
  }, [post.id]);

  const avatarSrc = withAvatarVersion(authorProfile.avatarURL, authorProfile.avatarUpdatedAt);

  const stopCardClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const handleCardClick = () => {
    router.push(postHref);
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      router.push(postHref);
    }
  };

  const handleCommentSubmit = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!user?.uid) {
      alert("Please log in to comment.");
      return;
    }

    const trimmedText = commentText.trim();
    if (!trimmedText || commentSaving) {
      return;
    }

    try {
      setCommentSaving(true);
      const commentRef = push(ref(db, `comments/${post.id}`));
      await set(commentRef, {
        text: trimmedText,
        userId: user.uid,
        userName: user.displayName || user.email || "User",
        createdAt: Date.now(),
      });

      if (post.authorId && post.authorId !== user.uid) {
        await createNotification(db, {
          recipientUserId: post.authorId,
          type: "comment",
          actorId: user.uid,
          actorName: user.displayName || user.email || "User",
          href: postHref,
          entityId: post.id,
          entityTitle: post.title,
          previewText: trimmedText,
        });
      }
      setCommentText("");
    } catch (error) {
      console.error("Comment failed:", error);
      alert("Failed to post comment.");
    } finally {
      setCommentSaving(false);
    }
  };

  const handleShare = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(`${window.location.origin}${postHref}`);
      if (user?.uid && post.authorId && post.authorId !== user.uid) {
        await createNotification(db, {
          recipientUserId: post.authorId,
          type: "share",
          actorId: user.uid,
          actorName: user.displayName || user.email || "User",
          href: postHref,
          entityId: post.id,
          entityTitle: post.title,
          previewText: `${user.displayName || user.email || "Someone"} shared your post.`,
        });
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("Could not copy link.");
    }
  };

  const handleReport = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!user?.uid || reporting) {
      if (!user?.uid) {
        alert("Please log in to report posts.");
      }
      return;
    }

    const reason = window.prompt("Report reason:");
    if (!reason?.trim()) {
      return;
    }

    try {
      setReporting(true);
      const reportRef = push(ref(db, `reports/${post.id}`));
      await set(reportRef, {
        userId: user.uid,
        userName: user.displayName || user.email || "User",
        reason: reason.trim(),
        createdAt: Date.now(),
      });
      alert("Report submitted.");
    } catch (error) {
      console.error("Report failed:", error);
      alert("Failed to submit report.");
    } finally {
      setReporting(false);
    }
  };

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!canDelete || deleting) {
      return;
    }

    const confirmed = window.confirm("Are you sure?");
    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      const quoteSnapshot = await get(ref(db, `quotes/${post.id}`));
      const postsSnapshot = await get(ref(db, `posts/${post.id}`));

      // Delete primary content first; cleanup is best-effort and should not block delete.
      if (quoteSnapshot.exists()) {
        await remove(ref(db, `quotes/${post.id}`));
      }

      if (postsSnapshot.exists()) {
        await remove(ref(db, `posts/${post.id}`));
      }

      await Promise.allSettled([
        remove(ref(db, `comments/${post.id}`)),
        remove(ref(db, `likes/${post.id}`)),
        remove(ref(db, `reports/${post.id}`)),
      ]);

      router.refresh();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete post.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article
      className="overflow-hidden rounded-[30px] border border-white/10 bg-[#121218]/92 shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-5">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#b5ab9c]">
            <span className="rounded-full border border-[#d6a56f]/20 bg-[#d6a56f]/10 px-3 py-1">{post.type}</span>
            <span>{post.language}</span>
            <span>•</span>
            <span>{post.likeCount} likes</span>
          </div>
          <h2 className="serif-display text-3xl leading-tight text-[#f5efe2]">{post.title}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#a89f90]">
            <UserAvatar name={displayAuthorName} src={avatarSrc} size="sm" className="pointer-events-none" />
            <span>By</span>
            {!post.isAnonymous && post.authorId ? (
              <Link
                href={`/writers/${post.authorId}`}
                className="font-medium text-[#efe7d6] hover:text-white"
                onClick={stopCardClick}
              >
                {displayAuthorName}
              </Link>
            ) : (
              <span className="font-medium text-[#efe7d6]">{displayAuthorName}</span>
            )}
            <span>•</span>
            <span>{formatDate(post.createdAt)}</span>
          </div>
        </div>

        {canDelete ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-full border border-[#ff9e9e]/20 px-3 py-1 text-sm font-medium text-[#ffb7b7] hover:bg-[#ff9e9e]/8 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {deleting ? <ButtonSpinner /> : null}
            {deleting ? "Deleting..." : "Delete"}
          </button>
        ) : null}
      </div>

      {!hideContent ? (
        <div className="px-5 py-5">
          <p className="serif-display whitespace-pre-wrap text-xl leading-9 text-[#e4dccd]">{previewText || "No content yet."}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-white/8 px-5 py-4 text-sm text-[#cfc6b6]">
        {!hideSupportButton ? <LikeButton postId={post.id} likeCount={post.likeCount} authorId={post.authorId} postTitle={post.title} /> : null}
        <span>Comments {comments.length}</span>
        <button type="button" className="font-medium hover:text-white" onClick={handleShare}>
          {copied ? "Copied" : "Share"}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 font-medium hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
          onClick={handleReport}
          disabled={reporting}
        >
          {reporting ? <ButtonSpinner /> : null}
          {reporting ? "Reporting..." : "Report"}
        </button>
        <Link href={postHref} className="font-medium hover:text-white" onClick={stopCardClick}>
          View
        </Link>
      </div>

      {commentsEnabled ? (
        <div className="border-t border-white/8 px-5 py-5" onClick={stopCardClick}>
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder={user ? "Write a comment..." : "Login to comment"}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#d6a56f]/45"
            />
            <button
              type="button"
              onClick={handleCommentSubmit}
              disabled={commentSaving || !commentText.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#f0c18d] px-4 py-2 text-sm font-semibold text-[#140f0b] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {commentSaving ? <ButtonSpinner /> : null}
              {commentSaving ? "Posting..." : "Post"}
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {comments.length === 0 ? (
              <p className="text-sm text-[#a89f90]">No comments yet.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="rounded-2xl border border-white/8 bg-white/4 px-3 py-3">
                  <p className="text-sm text-[#ece3d4]">{comment.text}</p>
                  <p className="mt-1 text-xs text-[#a89f90]">
                    {comment.userName} • {formatDate(comment.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </article>
  );
}
