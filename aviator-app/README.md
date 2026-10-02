# Aviator — Provably Fair Crash Game

Real-money crash game built on Vercel serverless functions, MongoDB Atlas, and Paystack.

## Stack
- Frontend: Static HTML + Tailwind CSS + Vanilla JS
- Backend: Vercel Serverless Functions (TypeScript)
- Database: MongoDB Atlas
- Payments: Paystack
- Fairness: HMAC-SHA256 provably fair algorithm

## Setup

1. Clone repo: `git clone <url> aviator-app && cd aviator-app`
2. Install deps: `npm install`
3. Copy `.env.local.example` to `.env.local` and fill in keys.
4. Deploy: `vercel --prod`

## Environment Variables
See `.env.local` template for required keys.

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Login |
| `/api/auth/me` | GET | Current user |
| `/api/game/get-state` | GET | Current round state |
| `/api/game/place-bet` | POST | Place bet |
| `/api/game/cashout` | POST | Cash out active bet |
| `/api/game/history` | GET | Recent rounds |
| `/api/game/my-bets` | GET | User bet history |
| `/api/payments/initialize` | POST | Start Paystack deposit |
| `/api/payments/verify` | GET | Verify payment |
| `/api/webhook/paystack` | POST | Paystack webhook |
| `/api/provably-fair/verify` | GET | Verify a round |
| `/api/leaderboard` | GET | Top winners |
| `/api/live-bets` | GET | Active round bets |
| `/api/cron/tick-rounds` | GET | Round ticker (scheduled) |
| `/api/health` | GET | Health check |

## Cron
Round ticker must run every 1-5 seconds. Use an external scheduler (cron-job.org) pointing at `/api/cron/tick-rounds` with header `Authorization: Bearer $CRON_SECRET`.

## Security
- Never expose `PAYSTACK_SECRET_KEY` or `MONGODB_URI` to the client.
- Webhook signatures verified with HMAC-SHA512.
- Rate limiting on auth and betting endpoints.
- Server owns crash point; client only shows `serverSeedHash` before reveal.