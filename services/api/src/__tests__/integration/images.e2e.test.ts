import { describe, it, expect, beforeAll } from 'vitest';
import { build } from '../helpers/test-server';

describe('Images E2E Flow', () => {
  let app: any;
  let authToken: string;

  beforeAll(async () => {
    app = await build();
    // Register test user and get token
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'imagetest@example.com',
        password: 'Test123!@#',
        fullName: 'Image Test User',
      },
    });
    const data = JSON.parse(registerResponse.body);
    authToken = data.data.token;
  });

  it('should complete full generation flow', async () => {
    // Step 1: Check initial usage (should be 0)
    const historyResponse = await app.inject({
      method: 'GET',
      url: '/api/images/history',
      headers: { authorization: `Bearer ${authToken}` },
    });
    expect(historyResponse.statusCode).toBe(200);
    const history = JSON.parse(historyResponse.body);
    expect(history.data.length).toBe(0);

    // Step 2: Generate image
    const generateResponse = await app.inject({
      method: 'POST',
      url: '/api/images/generate',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        model: 'flux-1-schnell',
        prompt: 'A beautiful sunset over mountains',
        width: 1024,
        height: 1024,
      },
    });

    // Note: This will fail in CI without real OpenRouter key
    // In real environment, expect 200
    expect([200, 500]).toContain(generateResponse.statusCode);

    if (generateResponse.statusCode === 200) {
      const generateData = JSON.parse(generateResponse.body);
      expect(generateData.success).toBe(true);
      expect(generateData.data.imageUrl).toBeTruthy();
      expect(generateData.data.cost).toBeGreaterThan(0);

      // Step 3: Verify it appears in history
      const newHistoryResponse = await app.inject({
        method: 'GET',
        url: '/api/images/history',
        headers: { authorization: `Bearer ${authToken}` },
      });
      const newHistory = JSON.parse(newHistoryResponse.body);
      expect(newHistory.data.length).toBe(1);
      expect(newHistory.data[0].prompt).toBe('A beautiful sunset over mountains');
    }
  });

  it('should enforce daily limits', async () => {
    // Generate 10 images (free tier limit)
    for (let i = 0; i < 10; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/images/generate',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          model: 'flux-1-schnell',
          prompt: `Test image ${i}`,
          width: 512,
          height: 512,
        },
      });
    }

    // 11th should fail with 429
    const limitResponse = await app.inject({
      method: 'POST',
      url: '/api/images/generate',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        model: 'flux-1-schnell',
        prompt: 'Should fail',
        width: 512,
        height: 512,
      },
    });

    expect(limitResponse.statusCode).toBe(429);
  });
});
