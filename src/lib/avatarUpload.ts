import { ref, update } from "firebase/database";
import { db } from "@/app/firebase/config";
import { uploadImage } from "./uploadImage";

async function compressImage(file: File): Promise<Blob> {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read image."));
      img.src = sourceUrl;
    });

    const maxSize = 512;
    const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
    const targetWidth = Math.max(1, Math.round(image.width * scale));
    const targetHeight = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Image processing not available.");
    }

    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not compress image."));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        0.7,
      );
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export async function uploadAndSaveAvatar(userId: string, file: File): Promise<string> {
  const compressedBlob = await compressImage(file);
  const compressedFile = new File([compressedBlob], "avatar.jpg", { type: "image/jpeg" });
  const imageUrl = await uploadImage(compressedFile);
  await update(ref(db, `users/${userId}`), {
    avatarURL: imageUrl,
    avatarUpdatedAt: Date.now(),
  });
  return imageUrl;
}
