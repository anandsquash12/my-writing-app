"use client";

import { ChangeEvent, useRef, useState } from "react";
import { uploadAndSaveAvatar } from "@/lib/avatarUpload";
import UserAvatar from "./ui/UserAvatar";

interface AvatarUploadProps {
  userId: string;
  currentAvatar?: string;
  onSuccess?: (imageUrl: string) => void;
}

export default function AvatarUpload({ userId, currentAvatar, onSuccess }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const imageUrl = await uploadAndSaveAvatar(userId, file);
      onSuccess?.(imageUrl);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="avatar-upload">
      <UserAvatar name="Current avatar" src={currentAvatar} size="lg" />
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
        className={uploading ? "button-loading" : ""}
      >
        {uploading ? "Uploading..." : "Change Avatar"}
      </button>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
