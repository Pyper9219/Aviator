export interface PaystackWebhookPayload {
  event: string;
  data: {
    id: number;
    reference: string;
    channel: string;
    amount: number;
    metadata?: Record<string, unknown>;
  };
}
