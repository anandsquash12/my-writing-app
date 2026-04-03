export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const data = (await response.json()) as { error: string };
    throw new Error(data.error || "Upload failed");
  }

  const data = (await response.json()) as { secure_url: string };
  return data.secure_url;
}
