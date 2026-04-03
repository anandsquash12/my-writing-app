import { uploadImage } from "./uploadImage";

export async function uploadPostImage(file: File): Promise<string> {
  return await uploadImage(file);
}
