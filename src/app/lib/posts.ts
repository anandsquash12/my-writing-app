export interface PostRecord {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  createdAt: number;
  keywords: string[];
  likeCount: number;
}

interface RawPost {
  authorId?: unknown;
  authorName?: unknown;
  userId?: unknown;
  userName?: unknown;
  title?: unknown;
  content?: unknown;
  createdAt?: unknown;
  keywords?: unknown;
  likeCount?: unknown;
}

export function tokenizeForSearch(value: string): string[] {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .map((token) => token.trim())
        .filter(Boolean),
    ),
  );
}

function toSafeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toSafeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return 0;
}

export function normalizePost(postId: string, raw: unknown): PostRecord {
  const source = (raw || {}) as RawPost;
  const authorName = toSafeString(source.authorName) || toSafeString(source.userName) || "Unknown writer";
  const title = toSafeString(source.title) || "Untitled";
  const content = toSafeString(source.content);
  const normalizedKeywords =
    Array.isArray(source.keywords) && source.keywords.every((keyword) => typeof keyword === "string")
      ? source.keywords.map((keyword) => keyword.toLowerCase())
      : tokenizeForSearch(`${title} ${content}`);

  return {
    id: postId,
    authorId: toSafeString(source.authorId) || toSafeString(source.userId),
    authorName,
    title,
    content,
    createdAt: toSafeNumber(source.createdAt),
    keywords: normalizedKeywords,
    likeCount: Math.max(0, toSafeNumber(source.likeCount)),
  };
}

export function normalizePostsMap(data: Record<string, unknown> | null | undefined): PostRecord[] {
  if (!data) {
    return [];
  }

  return Object.entries(data).map(([id, value]) => normalizePost(id, value));
}

export function sortPostsNewestFirst(posts: PostRecord[]): PostRecord[] {
  return [...posts].sort((a, b) => b.createdAt - a.createdAt);
}

