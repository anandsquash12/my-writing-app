"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase/config";
import { QuoteRecord, normalizeQuotesMap } from "../lib/quotes";
import InstagramPostCard from "./InstagramPostCard";

export default function InstagramHomeFeedClient() {
  const [posts, setPosts] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const quotesRef = ref(db, "quotes");
    
    const unsubscribe = onValue(
      quotesRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const allQuotes = normalizeQuotesMap(snapshot.val());
          
          // Filter: public and published (assuming status field exists)
          const filtered = allQuotes.filter(
            (quote) => quote.visibility === "public"
          );
          
          // Sort by createdAt DESC
          const sorted = filtered.sort(
            (a, b) => b.createdAt - a.createdAt
          );
          
          setPosts(sorted);
        } else {
          setPosts([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching quotes:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          <p className="text-gray-600 mt-4">Loading posts...</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center text-gray-500">
          <p className="text-lg">No posts yet</p>
          <p className="text-sm">Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <InstagramPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
