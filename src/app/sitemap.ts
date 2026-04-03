import type { MetadataRoute } from "next";
import { getSiteUrl } from "./lib/seo";
import { normalizePostsMap } from "./lib/posts";

async function fetchPublicPublishedPosts() {
  const databaseUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim().replace(/\/+$/, "");
  if (!databaseUrl) {
    return [];
  }

  try {
    const response = await fetch(`${databaseUrl}/posts.json`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) {
      return [];
    }
    const data = (await response.json()) as Record<string, unknown> | null;
    return normalizePostsMap(data).filter((post) => post.visibility === "public" && post.status === "published");
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/confessions`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/trending`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
  ];

  const posts = await fetchPublicPublishedPosts();
  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/posts/${encodeURIComponent(post.id)}`,
    lastModified: new Date(post.updatedAt || post.createdAt || Date.now()),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticRoutes, ...postRoutes];
}

