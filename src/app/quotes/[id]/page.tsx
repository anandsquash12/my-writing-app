"use client";

import { useEffect, useState } from "react";
import QuoteDetailsClient from "./QuoteDetailsClient";

interface QuoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const [quoteId, setQuoteId] = useState("");

  useEffect(() => {
    params.then(({ id }) => {
      setQuoteId(decodeURIComponent(id || ""));
    });
  }, [params]);

  if (!quoteId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-black"></div>
          <p className="mt-4 text-gray-600">Loading quote...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <QuoteDetailsClient quoteId={quoteId} />
      </div>
    </div>
  );
}
