import { YooCheckout, ICreatePayment, Payment } from '@a2seven/yoo-checkout';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getEnv } from '../config/env';

// Configure proxy for YooKassa requests (Russian VPS)
const proxyUrl = getEnv('YOOKASSA_PROXY_URL', '');

// Monkey-patch global https module to use proxy for YooKassa
if (proxyUrl) {
  const https = require('https');
  const originalRequest = https.request;
  const proxyAgent = new HttpsProxyAgent(proxyUrl);

  https.request = function(options: any, ...args: any[]) {
    // Only use proxy for YooKassa API
    if (options?.hostname === 'api.yookassa.ru' || options?.host === 'api.yookassa.ru') {
      options.agent = proxyAgent;
    }
    return originalRequest.call(this, options, ...args);
  };
}

const yookassa = new YooCheckout({
  shopId: getEnv('YOOKASSA_SHOP_ID'),
  secretKey: getEnv('YOOKASSA_SECRET_KEY'),
});

export interface CreateRecurrentPaymentParams {
  amount: number;
  description: string;
  returnUrl: string;
  userId: string;
  email: string;
}

export async function createRecurrentPayment({
  amount,
  description,
  returnUrl,
  userId,
  email,
}: CreateRecurrentPaymentParams, idempotenceKey?: string): Promise<Payment> {
  try {
    // Validate inputs
    if (amount <= 0) {
      throw new Error(`Invalid amount: ${amount}. Amount must be positive.`);
    }
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    const payment: ICreatePayment = {
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB',
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: returnUrl,
      },
      description,
      receipt: {
        customer: {
          email,
        },
        items: [
          {
            description: 'Premium подписка AI Chat Platform на 1 месяц',
            quantity: '1',
            amount: {
              value: amount.toFixed(2),
              currency: 'RUB',
            },
            vat_code: 1, // НДС не облагается
            payment_subject: 'service', // Услуга
            payment_mode: 'full_prepayment', // Полная предоплата
          },
        ],
      },
      metadata: {
        user_id: userId,
      },
    };

    console.log(`[YooKassa] Creating payment for user ${userId}: ${amount} RUB`);
    const createdPayment = await yookassa.createPayment(payment, idempotenceKey);
    console.log(`[YooKassa] Payment created: ${createdPayment.id}`);
    return createdPayment;
  } catch (error: any) {
    console.error('[YooKassa] Payment creation failed:', error.message || error);
    throw error;
  }
}

export async function getPaymentInfo(paymentId: string): Promise<Payment> {
  try {
    console.log(`[YooKassa] Getting payment info: ${paymentId}`);
    const payment = await yookassa.getPayment(paymentId);
    return payment;
  } catch (error: any) {
    console.error(`[YooKassa] Failed to get payment ${paymentId}:`, error.message || error);
    throw error;
  }
}

export async function cancelPayment(paymentId: string, idempotenceKey?: string): Promise<Payment> {
  try {
    console.log(`[YooKassa] Canceling payment: ${paymentId}`);
    const payment = await yookassa.cancelPayment(paymentId, idempotenceKey);
    console.log(`[YooKassa] Payment canceled: ${paymentId}`);
    return payment;
  } catch (error: any) {
    console.error(`[YooKassa] Failed to cancel payment ${paymentId}:`, error.message || error);
    throw error;
  }
}

export { yookassa };
