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
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-900 mb-4">You must be logged in to create premium content</p>
          <button onClick={() => router.push("/login")} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">✨ Create Premium Post</h1>
          <p className="text-gray-600">Share exclusive content and earn from your work</p>
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
