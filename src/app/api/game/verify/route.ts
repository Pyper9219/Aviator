import { NextRequest, NextResponse } from "next/server";
import { generateCrashMultiplier } from "@/lib/game-engine/provablyFair";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const serverSeed = searchParams.get("serverSeed");
  const clientSeed = searchParams.get("clientSeed");
  const nonce = Number(searchParams.get("nonce"));

  if (!serverSeed || !clientSeed || !nonce) {
    return NextResponse.json({ error: "Missing seeds" }, { status: 400 });
  }
  const result = generateCrashMultiplier({ serverSeed, clientSeed, nonce });
  return NextResponse.json({ success: true, ...result });
}
