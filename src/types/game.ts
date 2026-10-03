export type GamePhase = "PREPARING" | "IN_FLIGHT" | "CRASHED";

export interface Bet {
  id: string;
  userId: string;
  username: string;
  consoleSlot: 1 | 2;
  stakeAmount: number;
  autoCashoutMultiplier?: number;
  cashedOut: boolean;
  payoutAmount: number;
}
