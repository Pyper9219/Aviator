import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Bet } from "@/lib/db/models/Bet";

export async function GET() {
  try {
    await connectToDatabase();
    const top = await Bet.find({ status: "CASHED_OUT" })
      .sort({ payoutAmount: -1 }).limit(10)
      .select("username payoutAmount cashedOutMultiplier");
    return NextResponse.json({ success: true, top });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
