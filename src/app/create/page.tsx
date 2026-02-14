"use client";

import { useState } from "react";
import { db } from "../firebase/config";
import { ref, push, set } from "firebase/database";
import { useRouter } from "next/navigation";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [userName, setUserName] = useState("");
  const router = useRouter();

  const handleSubmit = () => {
    if (!title || !content || !userName) return alert("All fields required!");
    const postsRef = ref(db, "posts");
    const newPostRef = push(postsRef);
    set(newPostRef, { title, content, userName });
    alert("Post added!");
    router.push("/"); 
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Create New Post</h1>
      <input placeholder="Your Name" value={userName} onChange={e => setUserName(e.target.value)} style={{ display: "block", marginBottom: 10, width: 300 }} />
      <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} style={{ display: "block", marginBottom: 10, width: 300 }} />
      <textarea placeholder="Content" value={content} onChange={e => setContent(e.target.value)} style={{ display: "block", marginBottom: 10, width: 300, height: 100 }} />
      <button onClick={handleSubmit}>Add Post</button>
    </div>
  );
}
