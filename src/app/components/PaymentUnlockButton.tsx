"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { type PremiumPost, formatPrice } from "../lib/premiumPosts";
import { persistVaultPurchase } from "../lib/vault";
import { type LicenseType } from "../lib/purchases";
import { ButtonSpinner } from "./ui/Loading";

interface PaymentUnlockButtonProps {
  post: PremiumPost;
  isPurchased: boolean;
  onUnlocked?: () => void;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const COMMISSION_RATE = 0.2;

export default function PaymentUnlockButton({ post, isPurchased, onUnlocked }: PaymentUnlockButtonProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [licenseType, setLicenseType] = useState<LicenseType>("personal");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || window.Razorpay) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const amount = licenseType === "commercial" ? post.commercialPrice : post.personalPrice || post.price;
  const paymentLabel = licenseType === "commercial" ? `Buy commercial license for ${formatPrice(amount)}` : `Unlock for ${formatPrice(amount)}`;
  const licenseNote =
    licenseType === "commercial"
      ? "Commercial license allows usage in songs, videos, and public performances with credit, but does not transfer copyright."
      : "Personal license is for private reading and limited use only. Commercial use is not allowed.";

  const handleUnlock = async () => {
    if (!userId) {
      router.push("/login");
      return;
    }

    if (isPurchased || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/vault/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: post.id,
          amount,
          userId,
          creatorId: post.userId,
          licenseType,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.orderId) {
        throw new Error(data.error || "Failed to create payment order.");
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout failed to load.");
      }

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount * 100,
        currency: "INR",
        name: "ShabadLok Writers Vault",
        description: paymentLabel,
        order_id: data.orderId,
        theme: {
          color: "#d6a56f",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
        handler: async (paymentResponse: Record<string, string>) => {
          try {
            const verifyResponse = await fetch("/api/vault/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                paymentId: paymentResponse.razorpay_payment_id,
                orderId: paymentResponse.razorpay_order_id,
                signature: paymentResponse.razorpay_signature,
                postId: post.id,
                userId,
              }),
            });

            const verification = await verifyResponse.json();
            if (!verifyResponse.ok || verification.success !== true) {
              throw new Error(verification.error || "Payment verification failed.");
            }

            if (!db) {
              throw new Error("Database not available.");
            }

            const platformFee = Math.round(amount * COMMISSION_RATE);
            const creatorEarning = Math.max(amount - platformFee, 0);

            await persistVaultPurchase({
              db,
              paymentId: paymentResponse.razorpay_payment_id,
              orderId: paymentResponse.razorpay_order_id,
              userId,
              creatorId: post.userId,
              postId: post.id,
              amount,
              licenseType,
              creatorEarning,
              platformFee,
            });

            onUnlocked?.();
            router.refresh();
          } catch (purchaseError) {
            console.error("Error saving verified purchase:", purchaseError);
            setError(purchaseError instanceof Error ? purchaseError.message : "Payment was captured, but unlock failed.");
          } finally {
            setIsProcessing(false);
          }
        },
      });

      razorpay.open();
    } catch (paymentError) {
      console.error("Error initiating payment:", paymentError);
      setError(paymentError instanceof Error ? paymentError.message : "Failed to initiate payment.");
      setIsProcessing(false);
    }
  };

  if (isPurchased) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-[#9ddeaf]/25 bg-[#9ddeaf]/10 px-5 py-3 font-semibold text-[#dff5e3]">
        <span>Unlocked</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-3">
        <button
          type="button"
          onClick={() => setLicenseType("personal")}
          className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
            licenseType === "personal" ? "bg-[#f0c18d] text-[#140f0b]" : "bg-white/5 text-[#e8dfcf]"
          }`}
        >
          Personal
        </button>
        <button
          type="button"
          onClick={() => setLicenseType("commercial")}
          className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
            licenseType === "commercial" ? "bg-[#f0c18d] text-[#140f0b]" : "bg-white/5 text-[#e8dfcf]"
          }`}
        >
          Commercial
        </button>
      </div>

      <button
        onClick={handleUnlock}
        disabled={isProcessing}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f0c18d] px-6 py-3 font-semibold text-[#140f0b] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isProcessing ? <ButtonSpinner /> : null}
        {isProcessing ? "Opening secure checkout..." : paymentLabel}
      </button>

      <div className="rounded-[24px] border border-white/10 bg-[#0f1015]/90 p-4 text-sm text-[#d2c8b7]">
        <p className="font-semibold text-[#f5efe2]">License note</p>
        <p className="mt-2">{licenseNote}</p>
      </div>

      {error ? <p className="text-sm text-[#ffb7b7]">{error}</p> : null}
      <p className="text-xs text-[#a89f90]">Supports UPI, cards, netbanking, and wallets through Razorpay.</p>
    </div>
  );
}
