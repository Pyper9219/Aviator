// lib/paystack.ts
import { createHmac } from 'crypto';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE = 'https://api.paystack.co';

type PaystackApiResponse<T> = {
  status: boolean;
  message?: string;
  data: T;
};

export async function initializePayment(
  email: string,
  amountNaira: number,
  reference: string,
  callbackUrl: string
) {
  // Paystack expects amount in kobo (1 Naira = 100 kobo)
  const amountKobo = Math.round(amountNaira * 100);

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: amountKobo,
      reference,
      callback_url: callbackUrl,
    }),
  });

  const data = (await res.json()) as PaystackApiResponse<{
    authorization_url?: string;
    access_code?: string;
    reference?: string;
  }>;

  if (!data.status) throw new Error(data.message || 'Paystack initialization failed');
  return data.data;
}

export async function verifyPayment(reference: string) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });

  const data = (await res.json()) as PaystackApiResponse<{
    status?: string;
    amount?: number;
    currency?: string;
    customer?: { email?: string };
  }>;

  if (!data.status || !data.data || data.data.status !== 'success') {
    throw new Error('Payment not successful');
  }

  return data.data;
}

/**
 * Verify Paystack webhook signature using HMAC SHA-512.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const hash = createHmac('sha512', PAYSTACK_SECRET)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
}