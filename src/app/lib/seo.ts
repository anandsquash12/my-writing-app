import { normalizePost, type PostRecord } from "./posts";

function normalizeSiteUrl(rawUrl: string | undefined): string {
  return (rawUrl || "").trim().replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) || "http://localhost:3000";
}

export function buildCanonical(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

export function stripHtmlToText(input: string): string {
  return input.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export function toMetaDescription(input: string, maxLength = 160): string {
  const clean = stripHtmlToText(input);
  if (clean.length <= maxLength) {
    return clean;
  }
  return clean.slice(0, maxLength).trim();
}

export async function fetchPostForMetadata(postId: string): Promise<PostRecord | null> {
  const databaseUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL);
  if (!databaseUrl || !postId) {
    return null;
  }

  try {
    // Fetch from /quotes (unified data source)
    const response = await fetch(`${databaseUrl}/quotes/${encodeURIComponent(postId)}.json`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (!data) {
      return null;
    }
    return normalizePost(postId, data);
  } catch {
    return null;
  }
}

