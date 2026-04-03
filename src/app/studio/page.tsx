"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import QuoteStudioEditor from "../components/quotes/QuoteStudioEditor";
import { useAuth } from "../context/AuthContext";

export default function StudioPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  if (loading) {
    return <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">Loading studio...</div>;
  }

  if (!user) {
    return <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">Redirecting to login...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">ShabadLok Studio</h1>
        <p className="text-sm text-neutral-600">Create quote images, style text layers, and publish to the public feed.</p>
      </div>
      <QuoteStudioEditor />
    </div>
  );
}
