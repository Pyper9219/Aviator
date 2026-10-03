import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { GameRound } from "@/lib/db/models/GameRound";

export async function GET() {
  try {
    await connectToDatabase();
    const round = await GameRound.findOne({ status: { $in: ["PREPARING", "IN_FLIGHT"] } })
      .sort({ roundNumber: -1 });
    return NextResponse.json({ success: true, round });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
