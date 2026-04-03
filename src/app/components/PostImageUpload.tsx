"use client";

import { ChangeEvent, useRef, useState } from "react";
import { uploadPostImage } from "@/lib/postImageUpload";

interface PostImageUploadProps {
  onImageSelect: (imageUrl: string) => void;
  selectedImage?: string;
}

export default function PostImageUpload({ onImageSelect, selectedImage }: PostImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const imageUrl = await uploadPostImage(file);
      onImageSelect(imageUrl);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="post-image-upload">
      {selectedImage && (
        <div className="image-preview">
          <img src={selectedImage} alt="Post preview" />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        style={{ display: "none" }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={uploading ? "button-loading" : "secondary-button"}
      >
        {uploading ? "Uploading..." : "Add Image"}
      </button>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
