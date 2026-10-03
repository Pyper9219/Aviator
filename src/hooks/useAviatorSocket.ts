"use client";
import { useEffect, useState } from "react";
import Pusher from "pusher-js";

export function useAviatorSocket() {
  const [multiplier, setMultiplier] = useState(1.0);
  const [gameState, setGameState] = useState<"PREPARING" | "IN_FLIGHT" | "CRASHED">("PREPARING");
  const [roundNumber, setRoundNumber] = useState(1);
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    const pusher = new Pusher(key, { cluster });
    const channel = pusher.subscribe("aviator-flight");

    channel.bind("TICK", (data: { multiplier: number; roundNumber: number }) => {
      setMultiplier(data.multiplier);
      setRoundNumber(data.roundNumber);
      setGameState("IN_FLIGHT");
    });

    channel.bind("ROUND_CRASHED", (data: { finalMultiplier: number; roundNumber: number }) => {
      setMultiplier(data.finalMultiplier);
      setGameState("CRASHED");
      setHistory((prev) => [data.finalMultiplier, ...prev.slice(0, 19)]);
    });

    channel.bind("ROUND_PREPARING", (data: { roundNumber: number }) => {
      setMultiplier(1.0);
      setRoundNumber(data.roundNumber);
      setGameState("PREPARING");
    });

    return () => {
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, []);

  return { multiplier, gameState, roundNumber, history };
}
