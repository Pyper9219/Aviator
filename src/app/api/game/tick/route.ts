import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { GameRound } from "@/lib/db/models/GameRound";
import { getPusherServer } from "@/lib/game-engine/realtime";
import { generateCrashMultiplier } from "@/lib/game-engine/provablyFair";
import { Client } from "@upstash/qstash";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });
const TICK_MS = parseInt(process.env.GAME_TICK_INTERVAL_MS || "1000", 10);
const PREPARE_MS = parseInt(process.env.GAME_PREPARE_MS || "5000", 10);
const GROWTH_RATE = parseFloat(process.env.GAME_GROWTH_RATE || "1.0718");

export async function POST(req: NextRequest) {
  try {
    // Optional: verify QStash signature in production
    if (process.env.NODE_ENV === "production") {
      const sig = req.headers.get("upstash-signature");
      if (!sig) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const pusher = getPusherServer();

    let round = await GameRound.findOne({
      status: { $in: ["PREPARING", "IN_FLIGHT"] },
    }).sort({ roundNumber: -1 });

    // Bootstrap new round
    if (!round) {
      const last = await GameRound.findOne().sort({ roundNumber: -1 });
      const roundNumber = (last?.roundNumber || 0) + 1;

      round = await GameRound.create({
        roundNumber,
        serverSeed: crypto.randomBytes(32).toString("hex"),
        clientSeed: crypto.randomBytes(16).toString("hex"),
        nonce: Date.now(),
        sha256Hash: "pending",
        crashMultiplier: 0,
        status: "PREPARING",
        startedAt: new Date(),
      });

      await pusher.trigger("aviator-flight", "ROUND_PREPARING", {
        roundNumber: round.roundNumber,
      });
    }

    // PREPARING -> IN_FLIGHT
    if (round.status === "PREPARING") {
      const elapsed = Date.now() - new Date(round.startedAt).getTime();
      if (elapsed >= PREPARE_MS) {
        const { multiplier, hash } = generateCrashMultiplier({
          serverSeed: round.serverSeed,
          clientSeed: round.clientSeed,
          nonce: round.nonce,
        });

        round.crashMultiplier = multiplier;
        round.sha256Hash = hash;
        round.status = "IN_FLIGHT";
        round.startedAt = new Date();
        await round.save();
      }
    }

    // IN_FLIGHT -> tick or crash
    if (round.status === "IN_FLIGHT") {
      const elapsed = Date.now() - new Date(round.startedAt).getTime();
      const current = Math.pow(GROWTH_RATE, elapsed / 1000);

      if (current >= round.crashMultiplier) {
        round.status = "CRASHED";
        round.crashedAt = new Date();
        await round.save();

        await pusher.trigger("aviator-flight", "ROUND_CRASHED", {
          finalMultiplier: round.crashMultiplier,
          roundNumber: round.roundNumber,
        });
      } else {
        await pusher.trigger("aviator-flight", "TICK", {
          multiplier: parseFloat(current.toFixed(2)),
          roundNumber: round.roundNumber,
        });
      }
    }

    // Recursive schedule next tick
    await qstash.publishJSON({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/game/tick`,
      delay: Math.max(1, Math.round(TICK_MS / 1000)),
    });

    return NextResponse.json({ success: true, status: round.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
