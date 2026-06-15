"use client";

import { useMemo, useState, useEffect } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { equalTo, onValue, orderByChild, query, ref } from "firebase/database";
import Link from "next/link";
import PostCard from "../components/PostCard";
import { auth, db } from "../firebase/config";
import { normalizePostsMap, sortPostsNewestFirst, type PostRecord } from "../lib/posts";

export default function Search() {
  const [searchText, setSearchText] = useState("");
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Fetch all posts from /quotes (unified data source)
    const allPostsRef = ref(db, "quotes");
    
    const unsubscribe = onValue(allPostsRef, (snapshot) => {
      const allPosts = normalizePostsMap(snapshot.val());
      
      // For public posts, show published ones
      // For own posts, show everything (published + drafts)
      const searchablePosts = allPosts.filter((post) => {
        const isOwn = post.authorId === user?.uid;
        const isPublished = post.status === "published";
        const isPublic = post.visibility === "public";
        
        // Include if: (own post of any type) OR (public & published)
        return isOwn || (isPublic && isPublished);
      });
      
      console.log("🔍 [SEARCH] LOADED ALL POSTS FROM /quotes:", {
        total: searchablePosts.length,
        posts: searchablePosts.map(p => ({ id: p.id, title: p.title })),
      });
      
      setPosts(sortPostsNewestFirst(searchablePosts));
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const normalizedQuery = searchText.trim().toLowerCase();
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

  const filteredPosts = useMemo(() => {
    if (!normalizedQuery) {
      return posts;
    }

    return posts.filter((post) => {
      const contentMatch = post.content.toLowerCase().includes(normalizedQuery);
      const titleMatch = post.title.toLowerCase().includes(normalizedQuery);
      const authorMatch = post.authorName.toLowerCase().includes(normalizedQuery);
      const typeMatch = post.type.toLowerCase().includes(normalizedQuery);
      const languageMatch = post.language.toLowerCase().includes(normalizedQuery);
      const tagMatch = post.tags.some((tag) => tag.includes(normalizedQuery));
      const keywordMatch = queryTokens.every((token) => post.keywords.some((keyword) => keyword.includes(token)));
      return titleMatch || contentMatch || authorMatch || typeMatch || languageMatch || tagMatch || keywordMatch;
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
          placeholder="Search by title, content, author, tags, type, or language"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
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
