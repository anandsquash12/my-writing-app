"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function PublishPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading publish options...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Choose What To Publish</h1>
          <p className="mt-2 text-gray-600">Pick the kind of post you want to create. Text writing and image posts now have separate flows.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Writing Post</p>
            <h2 className="mt-3 text-2xl font-semibold text-neutral-900">Text, poetry, shayari, quotes, lyrics</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Create a written post with title, rich text, genre, mood, language, tags, and public or private visibility.
            </p>
            <div className="mt-6">
              <Link
                href="/create"
                className="inline-flex rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white hover:bg-black"
              >
                Start Writing
              </Link>
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Image Post</p>
            <h2 className="mt-3 text-2xl font-semibold text-neutral-900">Write directly on an image</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Open the studio to design an image post, place text on the canvas, style it, and publish it as a visual post.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                href="/studio"
                className="inline-flex rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white hover:bg-black"
              >
                Open Studio
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
