"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { get, push, ref, set } from "firebase/database";
import { auth, db } from "../firebase/config";
import { type PremiumPost, formatPrice } from "../lib/premiumPosts";
import { ButtonSpinner } from "./ui/Loading";

interface PaymentUnlockButtonProps {
  post: PremiumPost;
  isPurchased: boolean;
  onUnlocked?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentUnlockButton({ post, isPurchased, onUnlocked }: PaymentUnlockButtonProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleUnlock = async () => {
    if (!userId) {
      router.push("/login");
      return;
    }

    if (isPurchased) {
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // Call API to create Razorpay order
      const response = await fetch("/api/vault/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: post.id,
          amount: post.price,
          userId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create payment order");
      }

      const data = await response.json();

      if (!data.orderId) {
        throw new Error("No order ID received");
      }

      // Open Razorpay checkout with Google Pay, Paytm, and Card/UPI options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: post.price * 100, // Convert to paise
        currency: "INR",
        name: "Writers Vault",
        description: `Unlock "${post.title}"`,
        order_id: data.orderId,
        handler: async (response: any) => {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch("/api/vault/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
                postId: post.id,
                userId: userId,
              }),
            });

            if (!verifyResponse.ok) {
              throw new Error("Payment verification failed");
            }

            // Save purchase to database
            const purchaseData = {
              userId: userId,
              postId: post.id,
              amount: post.price,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              createdAt: Date.now(),
            };

            const purchaseRef = push(ref(db, "purchases"));
            await set(purchaseRef, purchaseData);

            // Increment purchase count
            await get(ref(db, `premiumPosts/${post.id}/purchaseCount`)).then((snapshot) => {
              const currentCount = snapshot.val() || 0;
              set(ref(db, `premiumPosts/${post.id}/purchaseCount`), currentCount + 1).catch(console.error);
            });

            if (onUnlocked) {
              onUnlocked();
            }
            router.refresh();
          } catch (err) {
            console.error("Error saving purchase:", err);
            setError("Payment verified but failed to save purchase. Please contact support.");
          }
        },
        prefill: {
          email: "",
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
        // Enable all payment methods for Indian customers
        method: {
          googlepay: true, // Google Pay
          paytm: true,      // Paytm
          upi: true,        // UPI
          netbanking: true, // Net Banking
          card: true,       // Debit/Credit Card
          wallet: true,     // Digital Wallets
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Error initiating payment:", err);
      setError(err instanceof Error ? err.message : "Failed to initiate payment");
      setIsProcessing(false);
    }
  };

  if (isPurchased) {
    return (
      <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 text-green-700 rounded-lg border border-green-200 font-semibold">
        <span>✓</span>
        Content Unlocked
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleUnlock}
        disabled={isProcessing}
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? <ButtonSpinner /> : "🔓"}
        Unlock for {formatPrice(post.price)}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
