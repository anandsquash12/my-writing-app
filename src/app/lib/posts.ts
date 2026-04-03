export interface PostRecord {
  id: string;
  authorId: string;
  authorName: string;
  isAnonymous: boolean;
  mood: PostMood;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  keywords: string[];
  tags: string[];
  likeCount: number;
  viewCount: number;
  type: PostType;
  language: PostLanguage;
  visibility: PostVisibility;
  status: PostStatus;
}

export type PostType =
  | "Diary"
  | "Blog"
  | "Poetry"
  | "Shayari"
  | "Quote"
  | "Story"
  | "Song"
  | "Music Lyrics"
  | "Pop Music Lyrics"
  | "Rap"
  | "Ghazal"
  | "Other";
export type PostLanguage = "Hindi" | "English" | "Punjabi" | "Urdu" | "Other";
export type PostVisibility = "public" | "private";
export type PostStatus = "draft" | "published";
export type PostMood = "love" | "heartbreak" | "sad" | "anger" | "lonely" | "hope";

export const POST_TYPES: PostType[] = [
  "Diary",
  "Blog",
  "Poetry",
  "Shayari",
  "Quote",
  "Story",
  "Song",
  "Music Lyrics",
  "Pop Music Lyrics",
  "Rap",
  "Ghazal",
  "Other",
];
export const POST_LANGUAGES: PostLanguage[] = ["Hindi", "English", "Punjabi", "Urdu", "Other"];
export const POST_MOODS: PostMood[] = ["love", "heartbreak", "sad", "anger", "lonely", "hope"];

interface RawPost {
  authorId?: unknown;
  authorName?: unknown;
  userId?: unknown;
  userName?: unknown;
  isAnonymous?: unknown;
  mood?: unknown;
  title?: unknown;
  content?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  keywords?: unknown;
  tags?: unknown;
  likeCount?: unknown;
  viewCount?: unknown;
  type?: unknown;
  language?: unknown;
  visibility?: unknown;
  status?: unknown;
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

function toSafeBoolean(value: unknown): boolean {
  return value === true;
}

function normalizeType(value: unknown): PostType {
  return typeof value === "string" && POST_TYPES.includes(value as PostType) ? (value as PostType) : "Shayari";
}

function normalizeLanguage(value: unknown): PostLanguage {
  return typeof value === "string" && POST_LANGUAGES.includes(value as PostLanguage)
    ? (value as PostLanguage)
    : "Hindi";
}

function normalizeVisibility(value: unknown): PostVisibility {
  return value === "private" ? "private" : "public";
}

function normalizeStatus(value: unknown): PostStatus {
  return value === "draft" ? "draft" : "published";
}

function normalizeMood(value: unknown): PostMood {
  return typeof value === "string" && POST_MOODS.includes(value as PostMood) ? (value as PostMood) : "hope";
}

export function normalizePost(postId: string, raw: unknown): PostRecord {
  const source = (raw || {}) as RawPost;
  const authorName = toSafeString(source.authorName) || toSafeString(source.userName) || "Unknown writer";
  const isAnonymous = toSafeBoolean(source.isAnonymous);
  const mood = normalizeMood(source.mood);
  const title = toSafeString(source.title) || "Untitled";
  const content = toSafeString(source.content);
  const type = normalizeType(source.type);
  const language = normalizeLanguage(source.language);
  const visibility = normalizeVisibility(source.visibility);
  const status = normalizeStatus(source.status);
  const normalizedKeywords =
    Array.isArray(source.keywords) && source.keywords.every((keyword) => typeof keyword === "string")
      ? source.keywords.map((keyword) => keyword.toLowerCase()).filter(Boolean)
      : tokenizeForSearch(`${title} ${content} ${authorName} ${type} ${language}`);
  const normalizedTags =
    Array.isArray(source.tags) && source.tags.every((tag) => typeof tag === "string")
      ? source.tags.map((tag) => tag.toLowerCase()).filter(Boolean)
      : [];

  return {
    id: postId,
    authorId: toSafeString(source.authorId) || toSafeString(source.userId),
    authorName,
    isAnonymous,
    mood,
    title,
    content,
    createdAt: toSafeNumber(source.createdAt),
    updatedAt: toSafeNumber(source.updatedAt) || toSafeNumber(source.createdAt),
    keywords: normalizedKeywords,
    tags: normalizedTags,
    likeCount: Math.max(0, toSafeNumber(source.likeCount)),
    viewCount: Math.max(0, toSafeNumber(source.viewCount)),
    type,
    language,
    visibility,
    status,
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

export function buildPostKeywords(input: {
  title: string;
  content: string;
  authorName: string;
  tags: string[];
  type: PostType;
  language: PostLanguage;
  mood: PostMood;
}): string[] {
  const tagText = input.tags.join(" ");
  return tokenizeForSearch(
    `${input.title} ${input.content} ${input.authorName} ${tagText} ${input.type} ${input.language} ${input.mood}`,
  );
}
