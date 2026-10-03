"use client";
import { useEffect, useState } from "react";
import Pusher from "pusher-js";

export function useAviatorSocket(initialBalance = 4850.5) {
  const [multiplier, setMultiplier] = useState(1.0);
  const [gameState, setGameState] = useState<"PREPARING" | "IN_FLIGHT" | "CRASHED">("PREPARING");
  const [balance, setBalance] = useState(initialBalance);
  const [history, setHistory] = useState<number[]>([4.82, 1.24, 3.15, 14.8, 1.02, 2.64]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    const pusher = new Pusher(key, { cluster });
    const channel = pusher.subscribe("aviator-flight");

    channel.bind("TICK", (data: { multiplier: number }) => {
      setMultiplier(data.multiplier);
      setGameState("IN_FLIGHT");
    });
    channel.bind("ROUND_CRASHED", (data: { finalMultiplier: number }) => {
      setMultiplier(data.finalMultiplier);
      setGameState("CRASHED");
      setHistory((prev) => [data.finalMultiplier, ...prev.slice(0, 19)]);
    });
    channel.bind("ROUND_PREPARING", () => {
      setMultiplier(1.0);
      setGameState("PREPARING");
    });

    return () => {
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, []);

  return { multiplier, gameState, balance, setBalance, history };
}
