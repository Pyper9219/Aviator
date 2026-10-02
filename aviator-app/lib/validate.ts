export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

export function isValidAmount(amount: any): amount is number {
  return typeof amount === 'number' && isFinite(amount) && amount > 0;
}

export function sanitizeString(str: any, maxLen = 200): string {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}