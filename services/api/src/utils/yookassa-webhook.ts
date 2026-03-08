import crypto from 'crypto';
import { getEnv } from '../config/env';

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = getEnv('YOOKASSA_WEBHOOK_SECRET');
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return hash === signature;
}

export interface YooKassaWebhookEvent {
  type: 'notification';
  event: 'payment.succeeded' | 'payment.canceled' | 'refund.succeeded';
  object: {
    id: string;
    status: string;
    paid: boolean;
    amount: {
      value: string;
      currency: string;
    };
    metadata: {
      user_id?: string;
    };
    payment_method?: {
      id: string;
      saved: boolean;
    };
  };
}
