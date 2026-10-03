import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { Bet } from "@/lib/db/models/Bet";
import { GameRound } from "@/lib/db/models/GameRound";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { userId, consoleSlot, stakeAmount, autoCashoutMultiplier } = await req.json();

    if (!userId || !stakeAmount || stakeAmount <= 0) {
      return NextResponse.json({ error: "Invalid wager parameters" }, { status: 400 });
    }

    const activeRound = await GameRound.findOne({ status: { $in: ["PREPARING", "IN_FLIGHT"] } })
      .sort({ roundNumber: -1 });
    if (!activeRound) return NextResponse.json({ error: "No active round" }, { status: 400 });

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const user = await User.findOneAndUpdate(
        { _id: userId, balanceUSD: { $gte: stakeAmount } },
        { $inc: { balanceUSD: -stakeAmount } },
        { new: true, session }
      );
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }

      const [bet] = await Bet.create([{
        roundId: activeRound._id,
        roundNumber: activeRound.roundNumber,
        userId: user._id,
        username: user.username,
        consoleSlot,
        stakeAmount,
        autoCashoutMultiplier: autoCashoutMultiplier || null,
        status: "ACTIVE",
      }], { session });

      await session.commitTransaction();
      session.endSession();
      return NextResponse.json({ success: true, bet, newBalance: user.balanceUSD });
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
