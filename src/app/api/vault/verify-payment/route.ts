import crypto from "crypto";
import { NextResponse } from "next/server";

function verifyPaymentSignature(paymentId: string, orderId: string, signature: string): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return false;
  }

  const hmac = crypto.createHmac("sha256", keySecret);
  hmac.update(`${orderId}|${paymentId}`);
  return hmac.digest("hex") === signature;
}

export async function POST(request: Request) {
  try {
    const { paymentId, orderId, signature, postId, userId } = await request.json();

    if (
      typeof paymentId !== "string" ||
      typeof orderId !== "string" ||
      typeof signature !== "string" ||
      typeof postId !== "string" ||
      typeof userId !== "string"
    ) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    const isValid = verifyPaymentSignature(paymentId, orderId, signature);

    if (!isValid) {
      return NextResponse.json({ error: "Payment signature verification failed" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      paymentId,
      orderId,
      postId,
      userId,
      verifiedAt: Date.now(),
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
