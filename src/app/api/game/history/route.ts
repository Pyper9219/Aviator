import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { GameRound } from "@/lib/db/models/GameRound";

export async function GET() {
  try {
    await connectToDatabase();
    const rounds = await GameRound.find({ status: "CRASHED" })
      .sort({ roundNumber: -1 }).limit(30).select("crashMultiplier roundNumber");
    return NextResponse.json({ success: true, history: rounds });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
