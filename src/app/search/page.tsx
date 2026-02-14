"use client";

import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { ref, onValue } from "firebase/database";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const postsRef = ref(db, "posts");
    const unsubscribe = onValue(postsRef, snapshot => {
      const data = snapshot.val();
      setResults(data ? Object.values(data) : []);
    });
    return () => unsubscribe();
  }, []);

  const filtered = results.filter(post =>
    post.userName.toLowerCase().includes(query.toLowerCase()) ||
    post.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ padding: 20 }}>
      <h1>Search Posts</h1>
      <input placeholder="Search by user or title" value={query} onChange={e => setQuery(e.target.value)} style={{ marginBottom: 20, width: 300 }} />
      {filtered.length === 0 && <p>No results found.</p>}
      {filtered.map((post, index) => (
        <div key={index} style={{ marginTop: 10, padding: 10, border: "1px solid #ccc", borderRadius: 5 }}>
          <h3>{post.title}</h3>
          <p>{post.content}</p>
          <small>By: {post.userName}</small>
        </div>
      ))}
    </div>
  );
}
