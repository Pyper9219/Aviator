import { NextResponse } from "next/server";
import { Client } from "@upstash/qstash";

export const dynamic = "force-dynamic";

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

export async function POST() {
  try {
    await qstash.publishJSON({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/game/tick`,
      delay: 1,
    });
    return NextResponse.json({ success: true, message: "Game loop started" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
