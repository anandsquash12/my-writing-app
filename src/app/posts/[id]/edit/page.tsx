"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { get, onValue, ref, set } from "firebase/database";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../firebase/config";
import {
  buildPostKeywords,
  normalizePost,
  POST_LANGUAGES,
  POST_MOODS,
  POST_TYPES,
  type PostLanguage,
  type PostMood,
  type PostRecord,
  type PostStatus,
  type PostType,
  type PostVisibility,
} from "../../../lib/posts";
import RichTextEditor from "../../../components/RichTextEditor";

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const postId = params?.id || "";
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [postLoading, setPostLoading] = useState(true);
  const [post, setPost] = useState<PostRecord | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<PostType>("Shayari");
  const [language, setLanguage] = useState<PostLanguage>("Hindi");
  const [mood, setMood] = useState<PostMood>("hope");
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [status, setStatus] = useState<PostStatus>("draft");
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setAuthLoading(false);
        router.replace("/login");
        return;
      }

      const usesPassword = currentUser.providerData.some((provider) => provider.providerId === "password");
      if (usesPassword && !currentUser.emailVerified) {
        setAuthLoading(false);
        router.replace("/login?reason=verify");
        return;
      }

      setUser(currentUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, [router]);

  useEffect(() => {
    if (!postId) {
      return;
    }

    // Load post from /quotes (unified data source)
    const postRef = ref(db, `quotes/${postId}`);
    const unsubscribe = onValue(postRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setPost(null);
        setPostLoading(false);
        return;
      }

      const normalized = normalizePost(postId, data);
      console.log("📌 POST LOADED FROM /quotes:", normalized);
      setPost(normalized);
      setTitle(normalized.title);
      setContent(normalized.content);
      setType(normalized.type);
      setLanguage(normalized.language);
      setMood(normalized.mood);
      setVisibility(normalized.visibility);
      setIsAnonymous(normalized.isAnonymous);
      setStatus(normalized.status);
      setTagsInput(normalized.tags.join(", "));
      setPostLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  const authorName = useMemo(() => {
    if (!user) {
      return "";
    }
    return user.displayName || user.email || "Anonymous";
  }, [user]);

  const canEdit = user && post && post.authorId === user.uid;

  const handleSubmit = async () => {
    if (!post || !user || !canEdit) {
      return;
    }

    const plainContent = stripHtml(content);
    if (!title.trim() || !plainContent) {
      alert("Title and content are required.");
      return;
    }

    const tags = Array.from(
      new Set(
        tagsInput
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
      ),
    );

    const keywordAuthorName = isAnonymous ? "Anonymous Writer" : post.authorName || authorName;

    try {
      setSaving(true);
      // Verify authorization by fetching from /quotes
      const currentPostSnapshot = await get(ref(db, `quotes/${post.id}`));
      if (!currentPostSnapshot.exists()) {
        alert("Post not found.");
        return;
      }
      const source = (currentPostSnapshot.val() || {}) as { authorId?: unknown };
      if (source.authorId !== user.uid) {
        alert("Not authorized.");
        router.replace("/");
        return;
      }

      console.log("📝 UPDATING POST IN /quotes:", post.id);
      
      // Save updated post to /quotes collection
      await set(ref(db, `quotes/${post.id}`), {
        authorId: post.authorId,
        authorName: post.authorName || authorName,
        title: title.trim(),
        content: content.trim(),
        createdAt: post.createdAt || Date.now(),
        updatedAt: Date.now(),
        keywords: buildPostKeywords({
          title: title.trim(),
          content: plainContent,
          authorName: keywordAuthorName,
          tags,
          type,
          language,
          mood,
        }),
        tags,
        type,
        language,
        mood,
        isAnonymous,
        visibility,
        status,
        likeCount: Math.max(0, post.likeCount || 0),
        viewCount: Math.max(0, post.viewCount || 0),
      });
      console.log("✅ POST UPDATED IN /quotes");
      
      // Redirect to unified /quotes route      console.log("✅ POST UPDATED IN /quotes");
      
      // Redirect to unified /quotes route
      router.push(status === "draft" ? "/my-drafts" : `/quotes/${post.id}`);
    } catch (error) {
      console.error("❌ FAILED TO UPDATE POST:", error);
      const message = error instanceof Error ? error.message : "Failed to update post.";
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || postLoading) {
    return <div className="card">Loading post editor...</div>;
  }

  if (!post) {
    return <div className="card">Post not found.</div>;
  }

  if (!canEdit) {
    return <div className="card">Not available.</div>;
  }

  return (
    <div className="stack">
      <h1 className="page-title">Edit Post</h1>
      <div className="card form-stack">
        <input
          placeholder="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="input"
        />
        <RichTextEditor value={content} onChange={setContent} />
        <select value={type} onChange={(event) => setType(event.target.value as PostType)} className="input">
          {POST_TYPES.map((postType) => (
            <option key={postType} value={postType}>
              {postType}
            </option>
          ))}
        </select>
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value as PostLanguage)}
          className="input"
        >
          {POST_LANGUAGES.map((postLanguage) => (
            <option key={postLanguage} value={postLanguage}>
              {postLanguage}
            </option>
          ))}
        </select>
        <select value={mood} onChange={(event) => setMood(event.target.value as PostMood)} className="input">
          {POST_MOODS.map((postMood) => (
            <option key={postMood} value={postMood}>
              {postMood}
            </option>
          ))}
        </select>
        <label className="checkbox-row switch-row">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(event) => setIsAnonymous(event.target.checked)}
            className="switch-input"
          />
          <span>Post Anonymously</span>
        </label>
        <input
          placeholder="Tags (comma separated)"
          value={tagsInput}
          onChange={(event) => setTagsInput(event.target.value)}
          className="input"
        />
        <select
          value={visibility}
          onChange={(event) => setVisibility(event.target.value as PostVisibility)}
          className="input"
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value as PostStatus)} className="input">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <button onClick={handleSubmit} disabled={saving} className="primary-button">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
