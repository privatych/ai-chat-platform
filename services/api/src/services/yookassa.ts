import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getEnv } from '../config/env';
import { randomUUID } from 'crypto';

// ─── Proxy Configuration ────────────────────────────────────────────────────
// The main server is hosted in Amsterdam (NL). Yookassa only accepts requests
// from Russian IP addresses, so all Yookassa API calls are tunneled through
// a dedicated tinyproxy VPS in Russia (62.113.115.104:8888).
//
// IMPORTANT: The @a2seven/yoo-checkout SDK uses its own internal axios instance,
// so setting axios.defaults.httpsAgent does NOT work. We bypass the SDK entirely
// and use our own axios with the correct httpsAgent for every Yookassa request.
// ─────────────────────────────────────────────────────────────────────────────

const YOOKASSA_API = 'https://api.yookassa.ru/v3';

function buildYookassaClient() {
  const shopId  = getEnv('YOOKASSA_SHOP_ID');
  const secretKey = getEnv('YOOKASSA_SECRET_KEY');
  const proxyUrl = getEnv('YOOKASSA_HTTP_PROXY', 'http://62.113.115.104:8888');

  if (!proxyUrl) {
    console.warn('[YooKassa] No proxy set. Requests will fail from a non-RU IP.');
  } else {
    console.log(`[YooKassa] Using HTTP proxy: ${proxyUrl}`);
  }

  const httpsAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

  const client = axios.create({
    baseURL: YOOKASSA_API,
    auth: { username: shopId, password: secretKey },
    timeout: 30_000, // 30 second timeout
    httpsAgent,
    proxy: false,    // required when using a custom httpsAgent
  });

  return client;
}

// Lazy singleton – built once per server lifecycle, after env vars are loaded.
let _client: ReturnType<typeof buildYookassaClient> | null = null;

function getClient() {
  if (!_client) {
    _client = buildYookassaClient();
  }
  return _client;
}

// ─── API Methods ─────────────────────────────────────────────────────────────

interface CreatePaymentParams {
  amount: number;      // in RUB (e.g. 990 or 1990)
  description: string;
  returnUrl: string;
  userId: string;
}

export async function createRecurrentPayment({
  amount,
  description,
  returnUrl,
  userId,
}: CreatePaymentParams) {
  const idempotenceKey = randomUUID();
  console.log(`[YooKassa] Creating payment for user ${userId}: ${amount} RUB`);

  const payload = {
    amount: { value: amount.toFixed(2), currency: 'RUB' },
    capture: true,
    confirmation: { type: 'redirect', return_url: returnUrl },
    description,
    save_payment_method: true,
    metadata: { user_id: userId },
  };

  const { data } = await getClient().post('/payments', payload, {
    headers: { 'Idempotence-Key': idempotenceKey },
  });

  console.log(`[YooKassa] Payment created: ${data.id} (status: ${data.status})`);
  return data;
}

export async function getPaymentInfo(paymentId: string) {
  const { data } = await getClient().get(`/payments/${paymentId}`);
  return data;
}
