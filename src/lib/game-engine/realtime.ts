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

export async function broadcastTick(multiplier: number) {
  await getPusherServer().trigger("aviator-flight", "TICK", { multiplier });
}
export async function broadcastCrash(finalMultiplier: number) {
  await getPusherServer().trigger("aviator-flight", "ROUND_CRASHED", { finalMultiplier });
}
export async function broadcastPreparing() {
  await getPusherServer().trigger("aviator-flight", "ROUND_PREPARING", {});
}
