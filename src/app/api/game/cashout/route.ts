import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { Bet } from "@/lib/db/models/Bet";
import { GameRound } from "@/lib/db/models/GameRound";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { betId, userId, multiplier } = await req.json();

    const bet = await Bet.findOne({ _id: betId, userId, cashedOut: false, status: "ACTIVE" });
    if (!bet) return NextResponse.json({ error: "Bet not active" }, { status: 400 });

    const round = await GameRound.findById(bet.roundId);
    if (!round || round.status !== "IN_FLIGHT" || multiplier > round.crashMultiplier) {
      return NextResponse.json({ error: "Flight not active" }, { status: 400 });
    }

    const payout = parseFloat((bet.stakeAmount * multiplier).toFixed(2));
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      bet.cashedOut = true;
      bet.cashedOutMultiplier = multiplier;
      bet.payoutAmount = payout;
      bet.status = "CASHED_OUT";
      await bet.save({ session });

      const updatedUser = await User.findByIdAndUpdate(
        userId, { $inc: { balanceUSD: payout } }, { new: true, session }
      );

      await session.commitTransaction();
      session.endSession();
      return NextResponse.json({
        success: true, multiplier, payoutAmount: payout,
        profit: payout - bet.stakeAmount, newBalance: updatedUser?.balanceUSD,
      });
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
