import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Transaction } from "@/lib/db/models/Transaction";
import { paystackInitialize } from "@/lib/paystack/client";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { userId, amountUSD, email, currency = "NGN" } = await req.json();
    if (!userId || !amountUSD || amountUSD <= 0) {
      return NextResponse.json({ error: "Invalid deposit amount" }, { status: 400 });
    }

    const EXCHANGE_RATE = 1450;
    const localAmount = amountUSD * EXCHANGE_RATE;
    const amountInSubunits = Math.round(localAmount * 100);
    const reference = `AVIATOR_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const data = await paystackInitialize({
      email, amount: amountInSubunits, currency, reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/cashier?status=complete`,
      metadata: { userId, amountUSD, boosterMatch: true },
    });

    if (!data.status) {
      return NextResponse.json({ error: data.message || "Init failed" }, { status: 400 });
    }

    await Transaction.create({
      userId, reference, amount: localAmount, amountUSD,
      status: "pending", boosterApplied: true,
    });

    return NextResponse.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
