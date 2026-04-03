"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { onValue, push, ref, runTransaction, set } from "firebase/database";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebase/config";
import AuthorPostActions from "../../components/AuthorPostActions";
import PostCard from "../../components/PostCard";
import { ButtonSpinner, FeedSkeleton } from "../../components/ui/Loading";
import { createNotification } from "../../lib/notifications";
import { normalizePost, type PostRecord } from "../../lib/posts";

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

interface PostDetailsClientProps {
  postId: string;
}

function sanitizeRichHtml(input: string): string {
  const template = document.createElement("template");
  template.innerHTML = input;
  const allowedTags = new Set(["P", "BR", "STRONG", "B", "EM", "I", "H1", "H2", "H3", "UL", "OL", "LI", "BLOCKQUOTE"]);

  const walk = (node: Node) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        if (!allowedTags.has(element.tagName)) {
          const textNode = document.createTextNode(element.textContent || "");
          node.replaceChild(textNode, element);
          continue;
        }

        while (element.attributes.length > 0) {
          element.removeAttribute(element.attributes[0].name);
        }
      }
      walk(child);
    }
  };

  walk(template.content);
  return template.innerHTML;
}

export default function PostDetailsClient({ postId }: PostDetailsClientProps) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [post, setPost] = useState<PostRecord | null>(null);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const canViewPost = post ? post.authorId === user?.uid || (post.visibility === "public" && post.status === "published") : true;
  const commentsEnabled = post?.visibility === "public" && post?.status === "published" && !post?.isAnonymous;
  const shareEnabled = post?.visibility === "public" && post?.status === "published";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
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
    if (!postId || !commentsEnabled) {
      setComments([]);
      return;
    }

    const commentsRef = ref(db, `comments/${postId}`);
    const unsubscribe = onValue(
      commentsRef,
      (snapshot) => {
        const data = snapshot.val() as Record<string, unknown> | null;
        if (!data) {
          setComments([]);
          return;
        }

        const normalized = Object.entries(data)
          .map(([id, value]) => normalizeComment(id, value))
          .sort((a, b) => a.createdAt - b.createdAt);

        setComments(normalized);
      },
      (error) => {
        console.error("Error reading comments:", error);
      },
    );
    return () => unsubscribe();
  }, [postId, commentsEnabled]);

  useEffect(() => {
    if (!post) {
      return;
    }

    const shouldCountView = post.visibility === "public" && post.status === "published";
    if (!shouldCountView) {
      return;
    }

    const sessionKey = `viewed-post-${post.id}`;
    if (window.sessionStorage.getItem(sessionKey) === "1") {
      return;
    }

    window.sessionStorage.setItem(sessionKey, "1");
    const viewCountRef = ref(db, `quotes/${post.id}/viewCount`);
    runTransaction(viewCountRef, (current) => {
      const safeCurrent = typeof current === "number" ? current : 0;
      return Math.max(0, safeCurrent + 1);
    }).catch((error) => {
      console.error("View increment failed:", error);
      window.sessionStorage.removeItem(sessionKey);
    });
  }, [post]);

  const authorName = useMemo(() => {
    if (!user) {
      return "";
    }
    return user.displayName || user.email || "Anonymous";
  }, [user]);

  const safeHtmlContent = useMemo(() => sanitizeRichHtml(post?.content || ""), [post?.content]);

  const handleCommentSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!post?.id) {
      alert("Post ID is missing.");
      return;
    }

    if (!user) {
      alert("Please log in to comment.");
      router.push("/login");
      return;
    }

    if (!text.trim()) {
      return;
    }

    if (!commentsEnabled) {
      alert("Comments are available only on public posts.");
      return;
    }

    try {
      setSaving(true);

      const commentsRef = ref(db, `comments/${post.id}`);
      const newCommentRef = push(commentsRef);
      const commentText = text.trim();

      await set(newCommentRef, {
        text: commentText,
        userId: user.uid,
        userName: authorName || user.displayName || "Anonymous",
        createdAt: Date.now(),
      });

      if (post.authorId && post.authorId !== user.uid) {
        try {
          await createNotification(db, {
            recipientUserId: post.authorId,
            type: "comment",
            actorId: user.uid,
            actorName: authorName,
            href: `/posts/${post.id}`,
            entityId: post.id,
            entityTitle: post.title,
            previewText: commentText,
          });
        } catch (notificationError) {
          console.error("Notification write failed:", notificationError);
        }
      }

      setText("");
    } catch (error) {
      console.error("Comment error:", error);
      const message = error instanceof Error ? error.message : "Failed to comment.";
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      if (user?.uid && post?.authorId && post.authorId !== user.uid) {
        await createNotification(db, {
          recipientUserId: post.authorId,
          type: "share",
          actorId: user.uid,
          actorName: authorName,
          href: `/posts/${post.id}`,
          entityId: post.id,
          entityTitle: post.title,
          previewText: `${authorName} shared your post.`,
        });
      }
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1500);
    } catch (error) {
      console.error("Share failed:", error);
      alert("Could not copy link.");
    }
  };

  if (!post) {
    return <div className="card">Post not found.</div>;
  }

  if (!authReady) {
    return <FeedSkeleton />;
  }

  if (!canViewPost) {
    return <div className="card">Not available.</div>;
  }

  return (
    <div className="stack">
      <h1 className="page-title">Post Details</h1>
      <PostCard post={post} hideContent hideSupportButton={post.isAnonymous} />
      <div className="card">
        <p className="muted-text" style={{ margin: 0 }}>
          Views: {post.viewCount}
        </p>
      </div>
      <section className="card">
        <article className="post-content rich-content" dangerouslySetInnerHTML={{ __html: safeHtmlContent }} />
      </section>
      {shareEnabled ? (
        <div className="card">
          <div className="mode-toggle">
            <button onClick={handleShare} type="button" className="secondary-button">
              Share
            </button>
            {linkCopied ? <span className="muted-text">Link copied!</span> : null}
          </div>
        </div>
      ) : null}
      <AuthorPostActions post={post} currentUserId={user?.uid} redirectOnDelete="/" />

      {!post.isAnonymous ? (
        <>
          <section className="card stack">
            <h2 style={{ margin: 0 }}>Comments</h2>
            {!commentsEnabled ? <p className="muted-text">Comments are available only on published public posts.</p> : null}
            {commentsEnabled && comments.length === 0 ? <p className="muted-text">No comments yet.</p> : null}
            {comments.map((comment) => (
              <article key={comment.id} className="card">
                <p style={{ margin: "0 0 8px" }}>{comment.text}</p>
                <p className="post-meta">
                  {comment.userName} - {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : "Unknown date"}
                </p>
              </article>
            ))}
          </section>

          {commentsEnabled ? (
            <section className="card">
              <form onSubmit={handleCommentSubmit} className="form-stack">
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className="textarea"
                  placeholder={user ? "Write a comment..." : "Login to add a comment"}
                />
                <button type="submit" disabled={saving} className="primary-button">
                  <span className="inline-flex items-center gap-2">
                    {saving ? <ButtonSpinner /> : null}
                    {saving ? "Posting..." : "Add Comment"}
                  </span>
                </button>
              </form>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
