import crypto from "crypto";

export interface RoundSeeds {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

export function generateCrashMultiplier({ serverSeed, clientSeed, nonce }: RoundSeeds) {
  const message = `${clientSeed}:${nonce}`;
  const hash = crypto.createHmac("sha256", serverSeed).update(message).digest("hex");
  const h = parseInt(hash.substring(0, 13), 16);
  const e = Math.pow(2, 52);

  if (h % 33 === 0) return { multiplier: 1.0, hash };

  const raw = Math.floor((100 * e - h * 100) / (e - h)) / 100;
  return { multiplier: Math.max(1.0, parseFloat(raw.toFixed(2))), hash };
}
