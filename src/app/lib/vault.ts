"use client";

import { get, ref, runTransaction, set } from "firebase/database";
import type { Database } from "firebase/database";
import type { LicenseType } from "./purchases";

export function hasUnlockedPost(purchases: { postId: string; userId: string }[], userId: string | null | undefined, postId: string): boolean {
  if (!userId) {
    return false;
  }

  return purchases.some((purchase) => purchase.userId === userId && purchase.postId === postId);
}

export function getUnlockedPostIds(purchases: { postId: string; userId: string }[], userId: string | null | undefined): Set<string> {
  return new Set(purchases.filter((purchase) => purchase.userId === userId).map((purchase) => purchase.postId));
}

export async function persistVaultPurchase(input: {
  db: Database;
  paymentId: string;
  orderId: string;
  userId: string;
  creatorId: string;
  postId: string;
  amount: number;
  licenseType: LicenseType;
  creatorEarning: number;
  platformFee: number;
}) {
  const purchaseRef = ref(input.db, `purchases/${input.paymentId}`);
  const existingPurchase = await get(purchaseRef);

  if (!existingPurchase.exists()) {
    await set(purchaseRef, {
      userId: input.userId,
      creatorId: input.creatorId,
      postId: input.postId,
      amount: input.amount,
      licenseType: input.licenseType,
      creatorEarning: input.creatorEarning,
      platformFee: input.platformFee,
      razorpayPaymentId: input.paymentId,
      razorpayOrderId: input.orderId,
      createdAt: Date.now(),
    });

    const purchaseCountRef = ref(input.db, `premiumPosts/${input.postId}/purchaseCount`);
    await runTransaction(purchaseCountRef, (currentValue) => {
      const safeCount = typeof currentValue === "number" && Number.isFinite(currentValue) ? currentValue : 0;
      return safeCount + 1;
    });

    const totalEarningsRef = ref(input.db, `users/${input.creatorId}/totalEarnings`);
    await runTransaction(totalEarningsRef, (currentValue) => {
      const safeValue = typeof currentValue === "number" && Number.isFinite(currentValue) ? currentValue : 0;
      return safeValue + input.creatorEarning;
    });

    const availableBalanceRef = ref(input.db, `users/${input.creatorId}/availableBalance`);
    await runTransaction(availableBalanceRef, (currentValue) => {
      const safeValue = typeof currentValue === "number" && Number.isFinite(currentValue) ? currentValue : 0;
      return safeValue + input.creatorEarning;
    });

    const totalRevenueRef = ref(input.db, `platformStats/totalRevenue`);
    await runTransaction(totalRevenueRef, (currentValue) => {
      const safeValue = typeof currentValue === "number" && Number.isFinite(currentValue) ? currentValue : 0;
      return safeValue + input.amount;
    });

    const totalCommissionRef = ref(input.db, `platformStats/totalCommission`);
    await runTransaction(totalCommissionRef, (currentValue) => {
      const safeValue = typeof currentValue === "number" && Number.isFinite(currentValue) ? currentValue : 0;
      return safeValue + input.platformFee;
    });
  }

  return input.paymentId;
}
