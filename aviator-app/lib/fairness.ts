// lib/fairness.ts
import crypto from 'crypto';

/**
 * Generate the next crash multiplier using provably fair logic.
 * 1. Server generates a secret seed (stored server-side, hash revealed before round).
 * 2. Client has a public seed (editable by user).
 * 3. HMAC-SHA256(serverSeed, clientSeed + nonce) -> hexadecimal -> crash point.
 */
export function calculateCrashPoint(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  houseEdge: number = 0.01 // 1% house edge
): number {
  const message = `${clientSeed}:${nonce}`;
  const hash = crypto.createHmac('sha256', serverSeed).update(message).digest('hex');

  // Take first 8 hex chars -> convert to integer (0 to 2^32 - 1)
  const h = parseInt(hash.slice(0, 8), 16);
  const e = 2 ** 32;

  // Formula: (100 * e - h) / (e - h)
  // This maps h in [0, 2^32) to a crash point starting at 1.00x
  let crashPoint = (100 * e - h) / (e - h);

  // Apply house edge
  crashPoint = crashPoint * (1 - houseEdge);

  // Minimum crash point is 1.00x
  if (crashPoint < 1) crashPoint = 1;

  return Math.floor(crashPoint * 100) / 100; // Round to 2 decimals
}

/**
 * Generate a new server seed and its SHA-256 hash.
 * The hash is published BEFORE the round; the seed is revealed AFTER.
 */
export function generateServerSeed(): { seed: string; hash: string } {
  const seed = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  return { seed, hash };
}

/**
 * Verify a past round: recompute crash point from revealed seed.
 */
export function verifyRound(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  expectedCrashPoint: number
): boolean {
  const computed = calculateCrashPoint(serverSeed, clientSeed, nonce);
  return Math.abs(computed - expectedCrashPoint) < 0.001;
}