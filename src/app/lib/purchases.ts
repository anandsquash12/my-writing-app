export interface Purchase {
  id: string;
  userId: string;
  postId: string;
  amount: number; // in INR
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  createdAt: number;
}

interface RawPurchase {
  userId?: unknown;
  postId?: unknown;
  amount?: unknown;
  razorpayPaymentId?: unknown;
  razorpayOrderId?: unknown;
  createdAt?: unknown;
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

export function normalizePurchase(id: string, source: unknown): Purchase | null {
  if (!source || typeof source !== "object") {
    return null;
  }

  const data = source as RawPurchase;

  const userId = toSafeString(data.userId).trim();
  const postId = toSafeString(data.postId).trim();

  if (!userId || !postId) {
    return null;
  }

  return {
    id,
    userId,
    postId,
    amount: toSafeNumber(data.amount),
    razorpayPaymentId: toSafeString(data.razorpayPaymentId),
    razorpayOrderId: toSafeString(data.razorpayOrderId),
    createdAt: toSafeNumber(data.createdAt),
  };
}

export function normalizePurchasesMap(data: Record<string, unknown> | null | undefined): Purchase[] {
  if (!data || typeof data !== "object") {
    return [];
  }

  return Object.entries(data)
    .map(([id, purchase]) => normalizePurchase(id, purchase))
    .filter((purchase): purchase is Purchase => purchase !== null)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function generateRazorpayOrderId(): string {
  return `vault_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
