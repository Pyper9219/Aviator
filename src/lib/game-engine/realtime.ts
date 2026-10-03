import Pusher from "pusher";

let pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (pusherServer) return pusherServer;
  pusherServer = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
  });
  return pusherServer;
}

export const FLIGHT_CHANNEL = "aviator-flight";

export async function broadcastTick(multiplier: number, roundNumber: number) {
  await getPusherServer().trigger(FLIGHT_CHANNEL, "TICK", { multiplier, roundNumber });
}
export async function broadcastCrash(finalMultiplier: number, roundNumber: number) {
  await getPusherServer().trigger(FLIGHT_CHANNEL, "ROUND_CRASHED", { finalMultiplier, roundNumber });
}
export async function broadcastPreparing(roundNumber: number) {
  await getPusherServer().trigger(FLIGHT_CHANNEL, "ROUND_PREPARING", { roundNumber });
}
