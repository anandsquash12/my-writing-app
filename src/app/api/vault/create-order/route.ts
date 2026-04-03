import { NextResponse } from "next/server";

// For server-side, we'll make HTTP calls instead of importing the SDK
// This avoids module resolution issues

export async function POST(request: Request) {
  try {
    const { postId, amount, userId } = await request.json();

    if (!postId || !amount || !userId || amount < 1) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Missing Razorpay credentials");
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    // Create Razorpay order via API
    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to paise
        currency: "INR",
        receipt: `vault_${postId}_${userId}_${Date.now()}`,
        notes: {
          postId,
          userId,
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error("Razorpay API error:", {
        status: orderResponse.status,
        statusText: orderResponse.statusText,
        error: errorText,
        requestData: { amount: amount * 100, currency: "INR", postId, userId },
      });
      return NextResponse.json(
        { error: "Failed to create payment order", details: errorText },
        { status: 500 }
      );
    }

    const order = await orderResponse.json();

    return NextResponse.json({
      orderId: order.id,
      order,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
