import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { postId, amount, userId, creatorId, licenseType } = await request.json();

    if (
      typeof postId !== "string" ||
      typeof userId !== "string" ||
      typeof amount !== "number" ||
      amount < 1 ||
      typeof creatorId !== "string" ||
      (licenseType !== "personal" && licenseType !== "commercial")
    ) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
    }

    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const receipt = `vault_${postId}_${userId}_${Date.now()}`;

    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt,
        notes: {
          postId,
          userId,
          creatorId,
          licenseType,
          source: "writers-vault",
        },
      }),
    });

    if (!orderResponse.ok) {
      const details = await orderResponse.text();
      console.error("Razorpay create-order failed:", details);
      return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
    }

    const order = await orderResponse.json();

    return NextResponse.json({
      orderId: order.id,
      order,
      receipt,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}
