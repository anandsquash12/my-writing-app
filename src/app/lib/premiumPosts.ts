export interface PremiumPost {
  id: string;
  title: string;
  previewText: string;
  fullContent: string;
  category: PremiumPostCategory;
  price: number; // in INR
  imageUrl?: string;
  userId: string;
  authorName: string;
  createdAt: number;
  likeCount?: number;
  purchaseCount?: number;
}

export const PREMIUM_POST_CATEGORIES = [
  "shayari",
  "song",
  "poetry",
  "ghazal",
  "nazm",
  "story",
  "quotes",
  "other",
] as const;

export type PremiumPostCategory = (typeof PREMIUM_POST_CATEGORIES)[number];

const PREMIUM_POST_CATEGORY_LABELS: Record<PremiumPostCategory, string> = {
  shayari: "Shayari",
  song: "Song",
  poetry: "Poetry",
  ghazal: "Ghazal",
  nazm: "Nazm",
  story: "Story",
  quotes: "Quotes",
  other: "Other",
};

interface RawPremiumPost {
  title?: unknown;
  previewText?: unknown;
  fullContent?: unknown;
  category?: unknown;
  price?: unknown;
  imageUrl?: unknown;
  userId?: unknown;
  authorName?: unknown;
  createdAt?: unknown;
  likeCount?: unknown;
  purchaseCount?: unknown;
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

function toSafeCategory(value: unknown): PremiumPostCategory {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if ((PREMIUM_POST_CATEGORIES as readonly string[]).includes(normalized)) {
      return normalized as PremiumPostCategory;
    }
  }

  return "other";
}

export function normalizePremiumPost(id: string, source: unknown): PremiumPost | null {
  if (!source || typeof source !== "object") {
    return null;
  }

  const data = source as RawPremiumPost;

  const title = toSafeString(data.title).trim();
  const previewText = toSafeString(data.previewText).trim();
  const fullContent = toSafeString(data.fullContent).trim();
  const userId = toSafeString(data.userId).trim();
  const authorName = toSafeString(data.authorName).trim();

  if (!title || !previewText || !fullContent || !userId) {
    return null;
  }

  return {
    id,
    title,
    previewText,
    fullContent,
    category: toSafeCategory(data.category),
    price: toSafeNumber(data.price),
    imageUrl: toSafeString(data.imageUrl),
    userId,
    authorName,
    createdAt: toSafeNumber(data.createdAt),
    likeCount: toSafeNumber(data.likeCount),
    purchaseCount: toSafeNumber(data.purchaseCount),
  };
}

export function normalizePremiumPostsMap(data: Record<string, unknown> | null | undefined): PremiumPost[] {
  if (!data || typeof data !== "object") {
    return [];
  }

  return Object.entries(data)
    .map(([id, post]) => normalizePremiumPost(id, post))
    .filter((post): post is PremiumPost => post !== null)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(price);
}

export function getPremiumPostCategoryLabel(category: PremiumPostCategory): string {
  return PREMIUM_POST_CATEGORY_LABELS[category];
}
