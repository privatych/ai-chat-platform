import { YooCheckout, ICreatePayment, Payment } from '@a2seven/yoo-checkout';
import { getEnv } from '../config/env';

const yookassa = new YooCheckout({
  shopId: getEnv('YOOKASSA_SHOP_ID'),
  secretKey: getEnv('YOOKASSA_SECRET_KEY'),
});

export interface CreateRecurrentPaymentParams {
  amount: number;
  description: string;
  returnUrl: string;
  userId: string;
}

export async function createRecurrentPayment({
  amount,
  description,
  returnUrl,
  userId,
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
      save_payment_method: true, // Enable auto-renewal
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
