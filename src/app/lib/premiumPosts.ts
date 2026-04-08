export interface PremiumPost {
  id: string;
  title: string;
  previewText: string;
  fullContent: string;
  category: PremiumPostCategory;
  price: number; // personal unlock price in INR
  personalPrice: number;
  commercialPrice: number;
  licenseConfirmed: boolean;
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
  personalPrice?: unknown;
  commercialPrice?: unknown;
  licenseConfirmed?: unknown;
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
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
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

  const rawPersonalPrice = toSafeNumber(data.personalPrice);
  const rawLegacyPrice = toSafeNumber(data.price);
  const personalPrice = rawPersonalPrice || rawLegacyPrice || 0;
  const commercialPrice =
    toSafeNumber(data.commercialPrice) || Math.max(personalPrice * 2, personalPrice, 0);

  return {
    id,
    title,
    previewText,
    fullContent,
    category: toSafeCategory(data.category),
    price: personalPrice,
    personalPrice,
    commercialPrice,
    licenseConfirmed: Boolean(data.licenseConfirmed),
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
