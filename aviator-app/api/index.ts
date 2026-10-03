import type { VercelRequest, VercelResponse } from '@vercel/node';
import health from './health';
import leaderboard from './leaderboard';
import liveBets from './live-bets';
import login from './auth/login';
import me from './auth/me';
import register from './auth/register';
import tickRounds from './cron/tick-rounds';
import cashout from './game/cashout';
import getState from './game/get-state';
import history from './game/history';
import myBets from './game/my-bets';
import placeBet from './game/place-bet';
import initializePayment from './payments/initialize';
import verifyPayment from './payments/verify';
import verifyFairness from './provably-fair/verify';
import paystackWebhook from './webhook/paystack';

type Handler = (req: VercelRequest, res: VercelResponse) => unknown;

const handlers = new Map<string, Handler>([
  ['health', health],
  ['leaderboard', leaderboard],
  ['live-bets', liveBets],
  ['auth/login', login],
  ['auth/me', me],
  ['auth/register', register],
  ['cron/tick-rounds', tickRounds],
  ['game/cashout', cashout],
  ['game/get-state', getState],
  ['game/history', history],
  ['game/my-bets', myBets],
  ['game/place-bet', placeBet],
  ['payments/initialize', initializePayment],
  ['payments/verify', verifyPayment],
  ['provably-fair/verify', verifyFairness],
  ['webhook/paystack', paystackWebhook],
]);

export default function handler(req: VercelRequest, res: VercelResponse) {
  const requestedPath = req.query.path;
  const path = (Array.isArray(requestedPath) ? requestedPath.join('/') : requestedPath ?? '')
    .replace(/^\/+|\/+$/g, '');
  const routeHandler = handlers.get(path);

  if (!routeHandler) return res.status(404).json({ error: 'API route not found' });
  return routeHandler(req, res);
}