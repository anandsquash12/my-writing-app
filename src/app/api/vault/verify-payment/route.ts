import crypto from "crypto";
import { NextResponse } from "next/server";

function verifyPaymentSignature(
  paymentId: string,
  orderId: string,
  signature: string,
): boolean {
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_secret) return false;

  const hmac = crypto.createHmac("sha256", key_secret);
  hmac.update(`${orderId}|${paymentId}`);
  const digest = hmac.digest("hex");
  return digest === signature;
}

export async function POST(request: Request) {
  try {
    const { paymentId, orderId, signature, postId, userId } = await request.json();

    if (!paymentId || !orderId || !signature) {
      return NextResponse.json(
        { error: "Missing payment details" },
        { status: 400 }
      );
    }

    // Verify signature
    const isValid = verifyPaymentSignature(paymentId, orderId, signature);

    if (!isValid) {
      return NextResponse.json(
        { error: "Payment signature verification failed" },
        { status: 400 }
      );
    }

    // Payment is verified successfully
    // Database entry will be saved on client side
    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      paymentId,
      orderId,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
