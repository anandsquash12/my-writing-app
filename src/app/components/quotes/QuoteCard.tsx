"use client";

import Link from "next/link";
import type { QuoteRecord } from "../../lib/quotes";
import QuoteLikeButton from "./QuoteLikeButton";

interface QuoteCardProps {
  quote: QuoteRecord;
}

export default function QuoteCard({ quote }: QuoteCardProps) {
  const authorLabel = quote.isAnonymous ? "Anonymous Creator" : quote.authorName || "Unknown Creator";
  const safeImageUrl = quote.imageURL.trim();
  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <Link href={`/quotes/${quote.id}`} className="block">
        {safeImageUrl ? <img src={safeImageUrl} alt="Quote image" className="h-auto w-full object-cover" /> : null}
      </Link>
      <div className="flex items-center justify-between gap-3 px-3 py-3">
        <div>
          <p className="text-sm font-medium text-neutral-800">{authorLabel}</p>
          <p className="text-xs text-neutral-500">
            {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : "Unknown date"}
          </p>
        </div>
        <QuoteLikeButton
          quoteId={quote.id}
          likeCount={quote.likeCount}
          authorId={quote.authorId}
          quoteTitle={quote.textContent[0]?.text || "Quote"}
        />
      </div>
    </article>
  );
}
