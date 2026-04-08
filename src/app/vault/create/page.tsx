"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import PremiumPostForm from "../../components/PremiumPostForm";
import { ProfileShimmer } from "../../components/ui/Loading";

export default function CreatePremiumPostPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return <ProfileShimmer />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#09090b] py-12 px-4 text-center text-[#ece3d4]">
        <div className="mx-auto max-w-xl rounded-[32px] border border-white/10 bg-[#121218]/95 p-10 shadow-2xl">
          <p className="text-xl font-semibold mb-4">You must be logged in to publish premium writing.</p>
          <button onClick={() => router.push("/login")} className="rounded-full bg-[#f0c18d] px-6 py-3 text-sm font-semibold text-[#140f0b] transition hover:opacity-90">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] py-12 px-4 text-[#ece3d4]">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="rounded-[32px] border border-white/10 bg-[#121218]/95 p-8 shadow-2xl">
          <p className="hero-tag">Writers Vault</p>
          <h1 className="serif-display mt-4 text-4xl text-[#f5efe2]">Create premium writing that earns.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#d2c8b7]">
            Add personal and commercial license pricing, confirm ownership, and reach readers who want to pay for your best work.
          </p>
        </div>

        <PremiumPostForm
          onSuccess={() => {
            router.push("/vault");
          }}
        />
      </div>
    </div>
  );
}
