const POLL_INTERVAL = 500;
let lastRoundId = null;
let onUpdateCallback = null;

export function startPolling(callback) {
  onUpdateCallback = callback;
  poll();
  setInterval(poll, POLL_INTERVAL);
}

async function poll() {
  try {
    const res = await fetch('/api/game/get-state', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    lastRoundId = data.roundId;
    if (onUpdateCallback) onUpdateCallback(data);
  } catch (err) {
    console.warn('Poll failed:', err.message);
  }
}

export function getLastRoundId() {
  return lastRoundId;
}