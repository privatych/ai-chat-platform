import crypto from 'crypto';
import { getEnv } from '../config/env';

/**
 * YooKassa webhook event types
 */
export type YooKassaEventType =
  | 'payment.succeeded'
  | 'payment.canceled'
  | 'refund.succeeded';

/**
 * YooKassa webhook notification structure
 */
export interface YooKassaNotification {
  type: string;
  event: YooKassaEventType;
  object: {
    id: string;
    status: string;
    paid: boolean;
    amount: {
      value: string;
      currency: string;
    };
    created_at: string;
    metadata?: {
      user_id?: string;
    };
    payment_method?: {
      type: string;
      id: string;
      saved: boolean;
    };
    cancellation_details?: {
      party: string;
      reason: string;
    };
  };
}

/**
 * Verifies webhook signature from YooKassa
 * @param body - Raw request body as string
 * @param signature - Signature from X-Webhook-Signature header
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  try {
    const webhookSecret = getEnv('YOOKASSA_WEBHOOK_SECRET');

    // Calculate HMAC SHA-256 hash
    const hash = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('[Webhook] Signature verification failed:', error);
    return false;
  }
}

/**
 * Parses and validates YooKassa webhook notification
 * @param body - Parsed request body
 * @returns Validated notification object
 */
export function parseWebhookNotification(body: any): YooKassaNotification {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid webhook body: must be an object');
  }

  if (!body.event || typeof body.event !== 'string') {
    throw new Error('Invalid webhook body: missing event field');
  }

  if (!body.object || typeof body.object !== 'object') {
    throw new Error('Invalid webhook body: missing object field');
  }

  if (!body.object.id || typeof body.object.id !== 'string') {
    throw new Error('Invalid webhook body: missing object.id field');
  }

  return body as YooKassaNotification;
}

/**
 * YooKassa webhook IP whitelist for additional security
 * Source: https://yookassa.ru/docs/support/payments/webhook
 */
export const YOOKASSA_IPS = [
  '185.71.76.0/27',
  '185.71.77.0/27',
  '77.75.153.0/25',
  '77.75.156.11',
  '77.75.156.35',
  '77.75.154.128/25',
];

/**
 * Checks if IP address is from YooKassa
 * Note: This is optional additional security, not used in current implementation
 * @param ip - Client IP address
 * @returns true if IP is in whitelist
 */
export function isYooKassaIP(ip: string): boolean {
  // Simple exact match check (CIDR matching would require additional library)
  for (const allowedIP of YOOKASSA_IPS) {
    if (!allowedIP.includes('/') && allowedIP === ip) {
      return true;
    }
  }
  return false;
}
