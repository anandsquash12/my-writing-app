"use client";

import { useMemo, useState, useEffect } from "react";
import { db } from "../firebase/config";
import { ref, onValue } from "firebase/database";
import Link from "next/link";
import PostCard from "../components/PostCard";
import { normalizePostsMap, sortPostsNewestFirst, type PostRecord } from "../lib/posts";

export default function Search() {
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<PostRecord[]>([]);

  useEffect(() => {
    const postsRef = ref(db, "posts");
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      const normalized = normalizePostsMap(data);
      setPosts(sortPostsNewestFirst(normalized));
    });

    return () => unsubscribe();
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

  const filteredPosts = useMemo(() => {
    if (!normalizedQuery) {
      return posts;
    }

    return posts.filter((post) => {
      const titleMatch = post.title.toLowerCase().includes(normalizedQuery);
      const authorMatch = post.authorName.toLowerCase().includes(normalizedQuery);
      const keywordMatch = queryTokens.every((token) => post.keywords.some((keyword) => keyword.includes(token)));
      return titleMatch || authorMatch || keywordMatch;
    });
  }, [posts, normalizedQuery, queryTokens]);

  const matchedWriters = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    const map = new Map<string, { authorId: string; authorName: string }>();
    for (const post of posts) {
      if (!post.authorName.toLowerCase().includes(normalizedQuery)) {
        continue;
      }

      const uniqueKey = post.authorId || post.authorName.toLowerCase();
      if (!map.has(uniqueKey)) {
        map.set(uniqueKey, { authorId: post.authorId, authorName: post.authorName });
      }
    }
    return Array.from(map.values());
  }, [posts, normalizedQuery]);

  return (
    <div className="stack">
      <h1 className="page-title">Search</h1>
      <div className="card form-stack">
        <input
          placeholder="Search by title, keyword, or author"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="input"
        />
      </div>

      {matchedWriters.length > 0 ? (
        <div className="card">
          <strong>Matching writers</strong>
          <div className="stack" style={{ marginTop: 10 }}>
            {matchedWriters.map((writer) =>
              writer.authorId ? (
                <Link key={writer.authorId} href={`/writers/${writer.authorId}`} className="inline-link">
                  {writer.authorName}
                </Link>
              ) : (
                <span key={writer.authorName}>{writer.authorName}</span>
              ),
            )}
          </div>
        </div>
      ) : null}

      {filteredPosts.length === 0 ? (
        <div className="card">No results found.</div>
      ) : (
        <section className="post-list">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} excerpt />
          ))}
        </section>
      )}
    </div>
  );
}

