(() => {
  const tokenKey = 'aviator_token';

  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const token = sessionStorage.getItem(tokenKey);
    if (token && options.auth !== false) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(path, { ...options, headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `Request failed (${response.status})`);
    }
    return payload;
  }

  async function authenticate(path, values) {
    const result = await request(path, {
      method: 'POST',
      auth: false,
      body: JSON.stringify(values),
    });
    if (result.token) sessionStorage.setItem(tokenKey, result.token);
    return result;
  }

  window.api = Object.freeze({
    hasSession: () => Boolean(sessionStorage.getItem(tokenKey)),
    login: (values) => authenticate('/api/auth/login', values),
    register: (values) => authenticate('/api/auth/register', values),
    logout: () => sessionStorage.removeItem(tokenKey),
    getMe: () => request('/api/auth/me'),
    getState: () => request('/api/game/get-state', { auth: false }),
    placeBet: (values) => request('/api/game/place-bet', {
      method: 'POST',
      body: JSON.stringify(values),
    }),
    cashout: (betId) => request('/api/game/cashout', {
      method: 'POST',
      body: JSON.stringify({ betId }),
    }),
    initializeDeposit: (amount) => request('/api/payments/initialize', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
    verifyPayment: (reference) => request(
      `/api/payments/verify?reference=${encodeURIComponent(reference)}`
    ),
  });
})();