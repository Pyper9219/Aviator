"use client";
import { useState } from "react";
import { useAviatorSocket } from "@/hooks/useAviatorSocket";

export default function HomePage() {
  const { multiplier, gameState, balance, history } = useAviatorSocket();
  const [betAmount, setBetAmount] = useState(10);
  const [autoCashout, setAutoCashout] = useState(2.0);

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase text-white/50">flight</span>
          <h1 className="text-xl font-bold tracking-widest">AVIATOR</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-white/10 text-sm">
            ${balance.toFixed(2)}
          </div>
          <button className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold">
            Deposit
          </button>
          <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">
            Sign out
          </button>
        </div>
      </header>

      <section className="flex-1 grid grid-rows-[auto_1fr_auto] gap-4 p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs text-white/50">Round</span>
          <span className="px-2 py-1 rounded bg-white/10 text-xs">1</span>
          <span className="text-xs text-white/50 ml-4">Next round</span>
          <div className="flex gap-1 ml-auto">
            {history.map((h, i) => (
              <span
                key={i}
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  h < 2 ? "bg-blue-500/30 text-blue-200"
                  : h < 10 ? "bg-purple-500/30 text-purple-200"
                  : "bg-pink-500/30 text-pink-200"
                }`}
              >
                {h.toFixed(2)}x
              </span>
            ))}
          </div>
        </div>

        <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl font-extrabold tabular-nums">
              {multiplier.toFixed(2)}x
            </div>
            <div className="mt-2 text-sm text-white/60">
              {gameState === "PREPARING" && "Waiting for next round..."}
              {gameState === "IN_FLIGHT" && "In flight"}
              {gameState === "CRASHED" && "Flew away"}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-white/60">Bet amount</label>
            <div className="flex items-center mt-1 bg-black/30 rounded-lg px-3 py-2">
              <span className="text-white/50 mr-2">$</span>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="bg-transparent outline-none w-full"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/60">Auto cashout</label>
            <div className="flex items-center mt-1 bg-black/30 rounded-lg px-3 py-2">
              <input
                type="number"
                step="0.1"
                value={autoCashout}
                onChange={(e) => setAutoCashout(Number(e.target.value))}
                className="bg-transparent outline-none w-full"
              />
              <span className="text-white/50 ml-2">x</span>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <button className="flex-1 px-4 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 font-semibold">
              Place bet
            </button>
            <button className="flex-1 px-4 py-3 rounded-lg bg-amber-500 hover:bg-amber-600 font-semibold">
              Cash out
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
