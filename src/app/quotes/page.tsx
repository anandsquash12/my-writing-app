import Link from "next/link";
import QuotesFeedClient from "./QuotesFeedClient";

export default function QuotesPage() {
  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Explore</h1>
          <p className="text-sm text-neutral-600">Discover the latest writing posts and image posts from the community.</p>
        </div>
        <Link href="/studio" className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
          Create Image Post
        </Link>
      </section>
      <QuotesFeedClient />
    </div>
  );
}
