"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { push, ref, set, update } from "firebase/database";
import { auth, db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { uploadImage } from "@/lib/uploadImage";
import { ButtonSpinner } from "./ui/Loading";
import RichTextEditor from "./RichTextEditor";
import {
  PREMIUM_POST_CATEGORIES,
  getPremiumPostCategoryLabel,
  type PremiumPostCategory,
} from "../lib/premiumPosts";

interface PremiumPostFormProps {
  initialData?: {
    id: string;
    title: string;
    previewText: string;
    fullContent: string;
    category: PremiumPostCategory;
    price: number;
    imageUrl?: string;
  };
  onSuccess?: () => void;
}

export default function PremiumPostForm({ initialData, onSuccess }: PremiumPostFormProps) {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [title, setTitle] = useState(initialData?.title || "");
  const [previewText, setPreviewText] = useState(initialData?.previewText || "");
  const [fullContent, setFullContent] = useState(initialData?.fullContent || "");
  const [category, setCategory] = useState<PremiumPostCategory>(initialData?.category || "shayari");
  const [price, setPrice] = useState(initialData?.price?.toString() || "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const isValid = title.trim() && previewText.trim() && fullContent.trim() && price && parseInt(price) > 0;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
    } catch (error) {
      console.error("Image upload failed:", error);
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
      e.currentTarget.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in");
      return;
    }

    if (!isValid) {
      setError("All fields are required and price must be greater than 0");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const postData = {
        title: title.trim(),
        previewText: previewText.trim(),
        fullContent: fullContent.trim(),
        category,
        price: parseInt(price),
        imageUrl: imageUrl || null,
        userId: user.uid,
        authorName: profile.displayName || user.email || "Unknown",
        createdAt: Date.now(),
      };

      if (initialData?.id) {
        // Update existing
        await update(ref(db, `premiumPosts/${initialData.id}`), {
          ...postData,
          createdAt: undefined, // Don't update createdAt
        });
      } else {
        // Create new
        const newPostRef = push(ref(db, "premiumPosts"));
        await set(newPostRef, postData);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/vault");
      }
    } catch (err) {
      console.error("Error saving premium post:", err);
      setError("Failed to save premium post. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}

      {/* Title */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-2">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter post title"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Preview Text */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-2">Preview Text (Hook)</label>
        <p className="text-xs text-gray-500 mb-2">This is what readers see before unlocking</p>
        <textarea
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          placeholder="Write a compelling preview or hook..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          required
        />
      </div>

      {/* Full Content */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-2">Full Content (Locked)</label>
        <p className="text-xs text-gray-500 mb-2">This is only visible after purchase</p>
        <RichTextEditor value={fullContent} onChange={setFullContent} placeholder="Write the full premium content..." />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-2">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as PremiumPostCategory)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {PREMIUM_POST_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {getPremiumPostCategoryLabel(option)}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-2">Choose how this post should appear in the Vault feed.</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-2">Price (₹ INR)</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Enter price in rupees"
          min="1"
          step="1"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        <p className="text-xs text-gray-500 mt-2">Minimum price: ₹1</p>
      </div>

      {/* Image Upload */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-2">Cover Image (Optional)</label>
        {imageUrl && (
          <div className="mb-3 rounded-lg overflow-hidden bg-gray-100 h-40 border-2 border-gray-300">
            <img src={imageUrl} alt="Cover" className="w-full h-full object-cover" />
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploadingImage}
          className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none disabled:opacity-50"
        />
        <p className="text-xs text-gray-500 mt-2">{uploadingImage ? "Uploading image..." : "Click to select and upload cover image"}</p>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={!isValid || isSaving || uploadingImage}
          className="flex-1 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? <ButtonSpinner /> : null}
          {initialData ? "Update Premium Post" : "Publish Premium Post"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
