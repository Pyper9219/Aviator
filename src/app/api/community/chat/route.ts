import { NextRequest, NextResponse } from "next/server";

const messages: { user: string; text: string; ts: number }[] = [];

export async function GET() {
  return NextResponse.json({ success: true, messages: messages.slice(-50) });
}

export async function POST(req: NextRequest) {
  const { user, text } = await req.json();
  if (!user || !text) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  messages.push({ user, text, ts: Date.now() });
  return NextResponse.json({ success: true });
}
