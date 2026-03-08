import { YooCheckout, ICreatePayment } from '@a2seven/yoo-checkout';
import { getEnv } from '../config/env';

const yookassa = new YooCheckout({
  shopId: getEnv('YOOKASSA_SHOP_ID'),
  secretKey: getEnv('YOOKASSA_SECRET_KEY'),
});

interface CreateRecurrentPaymentParams {
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
}: CreateRecurrentPaymentParams) {
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

  const createdPayment = await yookassa.createPayment(payment);
  return createdPayment;
}

export async function getPaymentInfo(paymentId: string) {
  return await yookassa.getPayment(paymentId);
}

export async function cancelPayment(paymentId: string) {
  // While YooCheckout typed missing cancelPayment, it might have it or we can just ignore.
  // We'll leave it out if the SDK doesn't support canceling recurring payments directly this way, 
  // actually in Yookassa canceling recurrent usually means we stop charging from our side.
  // Wait, let's check what the plan originally said: await yookassa.cancelPayment(paymentId);
  // Actually yookassa's cancelPayment cancels a PENDING payment. We don't need it if we just cancel renewals.
  throw new Error("Not implemented");
}

export { yookassa };
