(() => {
  const root = document.getElementById('app');
  if (!root) return;

  let user = null;
  let round = null;
  let activeBetId = null;
  let registerMode = false;
  let refreshTimer = null;

  root.innerHTML = `
    <header class="border-b border-white/10 bg-[#0b0e14]">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <a href="/" class="flex items-center gap-2 font-bold tracking-wide text-white" aria-label="Aviator home">
          <span class="material-symbols-outlined text-[#ff6b68]" aria-hidden="true">flight</span>
          <span>AVIATOR</span>
        </a>
        <div class="flex items-center gap-3">
          <span id="account-summary" class="hidden text-sm text-white/70"></span>
          <a id="deposit-link" href="/deposit.html" class="hidden rounded bg-[#62ff96] px-3 py-2 text-sm font-bold text-[#102117]">Deposit</a>
          <button id="logout-button" class="hidden rounded border border-white/20 px-3 py-2 text-sm text-white" type="button">Sign out</button>
        </div>
      </div>
    </header>
    <main class="mx-auto grid w-full max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section class="min-w-0">
        <div class="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-white/55">
          <span>Round <span id="round-number" class="text-white">--</span></span>
          <span id="round-status" class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-white/40"></span>Connecting</span>
        </div>
        <div class="flex min-h-[280px] flex-col items-center justify-center border border-white/10 bg-[#151922] px-5 py-10 text-center sm:min-h-[360px]">
          <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-white/45">Current multiplier</p>
          <p id="multiplier" class="font-mono text-6xl font-bold text-white sm:text-8xl">1.00x</p>
          <p id="game-message" class="mt-5 min-h-6 text-sm text-white/65" role="status" aria-live="polite">Waiting for the next round</p>
        </div>
        <form id="bet-form" class="mt-4 grid gap-3 border border-white/10 bg-[#151922] p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label class="block text-xs font-semibold text-white/60">Bet amount
            <span class="mt-2 flex items-center rounded border border-white/15 bg-[#0b0e14] px-3">
              <span class="text-white/45">$</span>
              <input id="bet-amount" class="w-full bg-transparent px-2 py-3 text-white outline-none" type="number" min="1" step="0.01" value="1.00" required>
            </span>
          </label>
          <label class="block text-xs font-semibold text-white/60">Auto cashout
            <span class="mt-2 flex items-center rounded border border-white/15 bg-[#0b0e14] px-3">
              <input id="auto-cashout" class="w-full bg-transparent px-1 py-3 text-white outline-none" type="number" min="1.01" max="1000" step="0.01" placeholder="Off">
              <span class="text-white/45">x</span>
            </span>
          </label>
          <div class="flex gap-2">
            <button id="bet-button" class="min-h-11 flex-1 rounded bg-[#ff6b68] px-5 font-bold text-[#260a0a] disabled:cursor-not-allowed disabled:opacity-40" type="submit">Place bet</button>
            <button id="cashout-button" class="min-h-11 flex-1 rounded bg-[#62ff96] px-5 font-bold text-[#102117] disabled:cursor-not-allowed disabled:opacity-40" type="button" disabled>Cash out</button>
          </div>
        </form>
      </section>
      <aside class="flex flex-col gap-4">
        <section id="account-panel" class="border border-white/10 bg-[#151922] p-5">
          <div id="user-panel" class="hidden">
            <p class="text-xs font-semibold uppercase tracking-wider text-white/45">Account</p>
            <p id="username" class="mt-2 text-lg font-semibold text-white"></p>
            <p class="mt-4 text-xs text-white/50">Available balance</p>
            <p id="balance" class="mt-1 font-mono text-3xl font-semibold text-[#62ff96]">$0.00</p>
          </div>
          <div id="auth-panel">
            <h1 id="auth-title" class="text-lg font-semibold text-white">Sign in</h1>
            <p id="auth-description" class="mt-1 text-sm text-white/55">Sign in to place a bet.</p>
            <form id="auth-form" class="mt-4 space-y-3">
              <label id="username-field" class="hidden text-xs font-semibold text-white/60">Username
                <input id="auth-username" class="mt-1 w-full rounded border border-white/15 bg-[#0b0e14] px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff6b68]" autocomplete="username" minlength="3" maxlength="20">
              </label>
              <label class="block text-xs font-semibold text-white/60">Email
                <input id="auth-email" class="mt-1 w-full rounded border border-white/15 bg-[#0b0e14] px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff6b68]" type="email" autocomplete="email" required>
              </label>
              <label class="block text-xs font-semibold text-white/60">Password
                <input id="auth-password" class="mt-1 w-full rounded border border-white/15 bg-[#0b0e14] px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff6b68]" type="password" autocomplete="current-password" minlength="8" required>
              </label>
              <button id="auth-submit" class="w-full rounded bg-[#ff6b68] px-4 py-3 font-bold text-[#260a0a]" type="submit">Sign in</button>
            </form>
            <button id="auth-toggle" class="mt-4 text-sm text-[#62ff96] underline underline-offset-4" type="button">Create an account</button>
          </div>
          <p id="auth-message" class="mt-3 min-h-5 text-sm text-[#ffb3b2]" role="alert"></p>
        </section>
        <section class="border border-white/10 bg-[#151922] p-5">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-white/50">How it works</h2>
          <p class="mt-3 text-sm leading-6 text-white/70">Place your bet before the round starts, then cash out before the multiplier crashes.</p>
        </section>
      </aside>
    </main>`;

  const byId = (id) => document.getElementById(id);
  const money = (value) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value) || 0);

  function showMessage(element, text) {
    element.textContent = text || '';
  }

  function updateAccount() {
    byId('auth-panel').classList.toggle('hidden', Boolean(user));
    byId('user-panel').classList.toggle('hidden', !user);
    byId('deposit-link').classList.toggle('hidden', !user);
    byId('logout-button').classList.toggle('hidden', !user);
    byId('account-summary').classList.toggle('hidden', !user);
    byId('account-summary').textContent = user ? money(user.balance) : '';
    byId('username').textContent = user ? user.username : '';
    byId('balance').textContent = user ? money(user.balance) : money(0);
    byId('bet-button').disabled = !user || Boolean(activeBetId);
    byId('cashout-button').disabled = !user || !activeBetId || round?.status !== 'active';
  }

  function renderRound(data) {
    if (round?.roundId && data.roundId !== round.roundId && activeBetId) {
      activeBetId = null;
      showMessage(byId('game-message'), 'The previous round ended. Check your balance before betting again.');
    }
    round = data;
    byId('round-number').textContent = data.roundNumber ?? '--';
    const multiplier = Number(data.currentMultiplier) || 1;
    byId('multiplier').textContent = `${multiplier.toFixed(2)}x`;
    byId('multiplier').className = `font-mono text-6xl font-bold sm:text-8xl ${data.status === 'active' ? 'text-[#62ff96]' : 'text-white'}`;
    byId('round-status').innerHTML = `<span class="h-2 w-2 rounded-full ${data.status === 'active' ? 'bg-[#62ff96]' : 'bg-white/40'}"></span>${data.status === 'active' ? 'Live' : 'Next round'}`;
    if (!activeBetId) showMessage(byId('game-message'), data.status === 'active' ? 'Round in progress' : 'Place a bet for the next round');
    updateAccount();
  }

  function setAuthMode() {
    byId('auth-title').textContent = registerMode ? 'Create account' : 'Sign in';
    byId('auth-description').textContent = registerMode ? 'Create an account to play.' : 'Sign in to place a bet.';
    byId('username-field').classList.toggle('hidden', !registerMode);
    byId('auth-username').required = registerMode;
    byId('auth-password').autocomplete = registerMode ? 'new-password' : 'current-password';
    byId('auth-submit').textContent = registerMode ? 'Create account' : 'Sign in';
    byId('auth-toggle').textContent = registerMode ? 'Already have an account?' : 'Create an account';
  }

  async function refreshRound() {
    try {
      renderRound(await window.api.getState());
      refreshTimer = window.setTimeout(refreshRound, 1500);
    } catch (error) {
      byId('round-status').textContent = 'Offline';
      showMessage(byId('game-message'), error.message || 'Unable to load the current round.');
      refreshTimer = window.setTimeout(refreshRound, 10000);
    }
  }

  byId('auth-toggle').addEventListener('click', () => {
    registerMode = !registerMode;
    showMessage(byId('auth-message'), '');
    setAuthMode();
  });

  byId('auth-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = {
      email: byId('auth-email').value.trim(),
      password: byId('auth-password').value,
    };
    if (registerMode) values.username = byId('auth-username').value.trim();
    byId('auth-submit').disabled = true;
    showMessage(byId('auth-message'), '');
    try {
      const result = await window.api[registerMode ? 'register' : 'login'](values);
      user = result.user;
      updateAccount();
    } catch (error) {
      showMessage(byId('auth-message'), error.message);
    } finally {
      byId('auth-submit').disabled = false;
    }
  });

  byId('logout-button').addEventListener('click', () => {
    window.api.logout();
    user = null;
    activeBetId = null;
    updateAccount();
  });

  byId('bet-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!user) return showMessage(byId('auth-message'), 'Sign in before placing a bet.');
    const amount = Number(byId('bet-amount').value);
    const autoCashoutValue = byId('auto-cashout').value;
    const autoCashout = autoCashoutValue ? Number(autoCashoutValue) : null;
    try {
      const result = await window.api.placeBet({ amount, autoCashout });
      activeBetId = result.betId;
      user.balance = result.newBalance;
      showMessage(byId('game-message'), `Bet placed: ${money(amount)}`);
      updateAccount();
    } catch (error) {
      showMessage(byId('game-message'), error.message);
    }
  });

  byId('cashout-button').addEventListener('click', async () => {
    if (!activeBetId) return;
    try {
      const result = await window.api.cashout(activeBetId);
      activeBetId = null;
      user.balance = result.newBalance;
      showMessage(byId('game-message'), `Cashed out at ${Number(result.cashoutMultiplier).toFixed(2)}x · ${money(result.payout)}`);
      updateAccount();
    } catch (error) {
      showMessage(byId('game-message'), error.message);
    }
  });

  async function restoreSession() {
    if (!window.api.hasSession()) return;
    try {
      user = await window.api.getMe();
      updateAccount();
    } catch {
      user = null;
      updateAccount();
    }
  }

  setAuthMode();
  updateAccount();
  void restoreSession();
  void refreshRound();
})();