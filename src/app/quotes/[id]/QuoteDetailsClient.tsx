"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { onValue, push, ref, set } from "firebase/database";
import { useAuth } from "../../context/AuthContext";
import { database } from "../../firebase/config";
import QuoteLikeButton from "../../components/quotes/QuoteLikeButton";
import { ButtonSpinner, FeedSkeleton } from "../../components/ui/Loading";
import { createNotification } from "../../lib/notifications";
import { normalizeQuote, type QuoteRecord } from "../../lib/quotes";

interface QuoteDetailsClientProps {
  quoteId: string;
}

interface CommentRecord {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: number;
}

function normalizeComment(commentId: string, value: unknown): CommentRecord {
  const source = (value || {}) as Record<string, unknown>;
  return {
    id: commentId,
    userId:
      typeof source.userId === "string"
        ? source.userId
        : typeof source.authorId === "string"
          ? source.authorId
          : "",
    userName:
      typeof source.userName === "string"
        ? source.userName
        : typeof source.authorName === "string"
          ? source.authorName
          : "Unknown",
    text: typeof source.text === "string" ? source.text : "",
    createdAt: typeof source.createdAt === "number" ? source.createdAt : 0,
  };
}

export default function QuoteDetailsClient({ quoteId }: QuoteDetailsClientProps) {
  const { user } = useAuth();
  const [quote, setQuote] = useState<QuoteRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [commentText, setCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);

  useEffect(() => {
    const quoteRef = ref(database, `quotes/${quoteId}`);
    const unsubscribe = onValue(quoteRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setQuote(null);
        setLoading(false);
        return;
      }
      setQuote(normalizeQuote(quoteId, data));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [quoteId]);

  useEffect(() => {
    if (!quoteId) {
      setComments([]);
      return;
    }

    const commentsRef = ref(database, `comments/${quoteId}`);
    const unsubscribe = onValue(commentsRef, (snapshot) => {
      const data = (snapshot.val() || {}) as Record<string, unknown>;
      const nextComments = Object.entries(data)
        .map(([id, value]) => normalizeComment(id, value))
        .sort((a, b) => a.createdAt - b.createdAt);
      setComments(nextComments);
    });

    return () => unsubscribe();
  }, [quoteId]);

  const canView = useMemo(() => {
    if (!quote) {
      return false;
    }
    if (quote.visibility === "public") {
      return true;
    }
    return user?.uid === quote.authorId;
  }, [quote, user?.uid]);

  const safeImageUrl = quote?.imageURL.trim() || "";

  const handleDownload = async () => {
    if (!safeImageUrl || !quote) {
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = safeImageUrl;
    anchor.download = `shabadlok-quote-${quote.id}.png`;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.click();
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      if (user?.uid && quote?.authorId && quote.authorId !== user.uid) {
        await createNotification(database, {
          recipientUserId: quote.authorId,
          type: "share",
          actorId: user.uid,
          actorName: user.displayName || user.email || "User",
          href: `/quotes/${quote.id}`,
          entityId: quote.id,
          entityTitle: quote.textContent[0]?.text || "Quote",
          previewText: `${user.displayName || user.email || "Someone"} shared your quote.`,
        });
      }
      alert("Link copied.");
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleReport = async () => {
    if (!user?.uid || !quote || reporting) {
      return;
    }
    const reason = window.prompt("Why are you reporting this quote?");
    if (!reason || !reason.trim()) {
      return;
    }
    setReporting(true);
    try {
      const reportRef = push(ref(database, `reports/${quote.id}`));
      await set(reportRef, {
        userId: user.uid,
        userName: user.displayName || user.email || "User",
        reason: reason.trim(),
        createdAt: Date.now(),
      });
      alert("Report submitted.");
    } catch (error) {
      console.error("Report failed:", error);
      alert("Could not submit report.");
    } finally {
      setReporting(false);
    }
  };

  const handleCommentSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!quote || !user?.uid || savingComment) {
      if (!user?.uid) {
        alert("Please log in to comment.");
      }
      return;
    }

    const trimmedText = commentText.trim();
    if (!trimmedText) {
      return;
    }

    try {
      setSavingComment(true);
      const commentsRef = ref(database, `comments/${quote.id}`);
      const newCommentRef = push(commentsRef);

      await set(newCommentRef, {
        text: trimmedText,
        userId: user.uid,
        userName: user.displayName || user.email || "Anonymous",
        createdAt: Date.now(),
      });

      if (quote.authorId && quote.authorId !== user.uid) {
        const notificationRef = push(ref(database, `notifications/${quote.authorId}`));
        try {
          await set(notificationRef, {
            type: "comment",
            actorId: user.uid,
            postId: quote.id,
            postTitle: quote.textContent[0]?.text || "Quote",
            commentAuthorName: user.displayName || user.email || "Anonymous",
            commentText: trimmedText,
            read: false,
            createdAt: Date.now(),
          });
        } catch (notificationError) {
          console.error("Notification write failed:", notificationError);
        }
      }

      setCommentText("");
    } catch (error) {
      console.error("Comment failed:", error);
      alert("Could not post comment.");
    } finally {
      setSavingComment(false);
    }
  };

  if (loading) {
    return <FeedSkeleton />;
  }

  if (!quote) {
    return <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">Quote not found.</div>;
  }

  if (!canView) {
    return <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">This quote is private.</div>;
  }

  return (
    <div className="space-y-4">
      <Link href="/quotes" className="inline-flex text-sm font-medium text-neutral-600 hover:text-neutral-900">
        Back to Explore
      </Link>
      <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {!safeImageUrl ? null : <img src={safeImageUrl} alt="Quote image" className="h-auto w-full object-cover" />}
      </article>
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <p className="text-sm text-neutral-700">
          By <span className="font-medium">{quote.isAnonymous ? "Anonymous Creator" : quote.authorName || "Unknown Creator"}</span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <QuoteLikeButton
            quoteId={quote.id}
            likeCount={quote.likeCount}
            authorId={quote.authorId}
            quoteTitle={quote.textContent[0]?.text || "Quote"}
          />
          <span className="text-xs text-neutral-500">{comments.length} comments</span>
          <button onClick={handleDownload} className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium hover:bg-neutral-100" type="button">
            Download
          </button>
          <button onClick={handleShare} className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium hover:bg-neutral-100" type="button">
            Share link
          </button>
          <button
            onClick={handleReport}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-60"
            type="button"
            disabled={!user?.uid || reporting}
          >
            {reporting ? <ButtonSpinner /> : null}
            {reporting ? "Reporting..." : "Report"}
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="text-base font-semibold text-neutral-900">Comments</h2>
        <form onSubmit={handleCommentSubmit} className="mt-4 space-y-3">
          <textarea
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder={user ? "Write a comment..." : "Log in to comment"}
            className="min-h-24 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
          <button
            type="submit"
            disabled={savingComment || !commentText.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
          >
            {savingComment ? <ButtonSpinner /> : null}
            {savingComment ? "Posting..." : "Post Comment"}
          </button>
        </form>

        <div className="mt-5 space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-neutral-500">No comments yet.</p>
          ) : (
            comments.map((comment) => (
              <article key={comment.id} className="rounded-xl bg-neutral-50 p-3">
                <p className="text-sm text-neutral-800">{comment.text}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {comment.userName} · {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : "Unknown date"}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
