"use client";

import { useEffect, useMemo, useState } from "react";
import { db, auth } from "../firebase/config";
import { ref, push, set } from "firebase/database";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  buildPostKeywords,
  POST_LANGUAGES,
  POST_MOODS,
  POST_TYPES,
  type PostLanguage,
  type PostMood,
  type PostStatus,
  type PostType,
  type PostVisibility,
} from "../lib/posts";
import RichTextEditor from "../components/RichTextEditor";
import { findBannedWords } from "../lib/moderation";

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<PostType>("Shayari");
  const [language, setLanguage] = useState<PostLanguage>("Hindi");
  const [mood, setMood] = useState<PostMood>("hope");
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<PostStatus | null>(null);
  const [accessBlocked, setAccessBlocked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setAuthLoading(false);
        setAccessBlocked(true);
        router.replace("/login");
        return;
      }

      const usesPassword = currentUser.providerData.some((provider) => provider.providerId === "password");
      if (usesPassword && !currentUser.emailVerified) {
        setAuthLoading(false);
        setAccessBlocked(true);
        router.replace("/login?reason=verify");
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

  const handleSubmit = async (status: PostStatus) => {
    const plainContent = stripHtml(content);
    if (!title.trim() || !plainContent || !user) {
      alert("Title and content are required.");
      return;
    }
    const bannedMatches = findBannedWords(`${title} ${plainContent}`);
    if (bannedMatches.length > 0) {
      alert(`Post blocked due to banned words: ${Array.from(new Set(bannedMatches)).join(", ")}`);
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

    const keywordAuthorName = isAnonymous ? "Anonymous Writer" : authorName;

    try {
      setSavingStatus(status);
      // ALL posts save to /quotes collection
      const quotesRef = ref(db, "quotes");
      const newPostRef = push(quotesRef);
      const now = Date.now();
      
      const postData = {
        id: newPostRef.key,
        authorId: user.uid,
        authorName,
        title: title.trim(),
        content: content.trim(),
        createdAt: now,
        updatedAt: now,
        visibility,
        status,
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
        likeCount: 0,
        viewCount: 0,
      };
      
      console.log("📝 CREATING NEW POST IN /quotes:", postData);
      
      await set(newPostRef, postData);
      
      console.log("✅ POST SAVED TO /quotes:", newPostRef.key);
      
      router.push("/");
    } catch (error) {
      console.error("Failed to add post:", error);
      const message = error instanceof Error ? error.message : "Failed to add post.";
      alert(message);
    } finally {
      setSavingStatus(null);
    }
  };

  if (authLoading) {
    return <div className="card">Checking authentication...</div>;
  }

  if (!user) {
    return <div className="card">{accessBlocked ? "Access restricted. Redirecting..." : "Redirecting to login..."}</div>;
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
        <div className="mode-toggle">
          <button onClick={() => handleSubmit("draft")} disabled={savingStatus !== null} className="secondary-button">
            {savingStatus === "draft" ? "Saving..." : "Save as Draft"}
          </button>
          <button onClick={() => handleSubmit("published")} disabled={savingStatus !== null} className="primary-button">
            {savingStatus === "published" ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
