import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Transaction } from "@/lib/db/models/Transaction";
import { User } from "@/lib/db/models/User";
import { verifyPaystackSignature } from "@/lib/paystack/client";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    if (!verifyPaystackSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    if (event.event === "charge.success") {
      await connectToDatabase();
      const { reference, channel, id: paystackId } = event.data;
      const { userId, amountUSD } = event.data.metadata || {};

      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const tx = await Transaction.findOne({ reference }).session(session);
        if (tx && tx.status === "pending") {
          tx.status = "success";
          tx.paystackId = String(paystackId);
          tx.channel = channel;
          await tx.save({ session });

          const depositCredit = Number(amountUSD);
          const bonusCredit = Math.min(depositCredit, 1000);
          await User.findByIdAndUpdate(
            userId,
            { $inc: { balanceUSD: depositCredit, bonusBalanceUSD: bonusCredit } },
            { session }
          );
        }
        await session.commitTransaction();
        session.endSession();
      } catch (e) {
        await session.abortTransaction();
        session.endSession();
        throw e;
      }
    }
    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
