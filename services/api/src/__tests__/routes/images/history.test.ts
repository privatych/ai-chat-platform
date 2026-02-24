import { describe, it, expect, beforeEach } from 'vitest';
import { build } from '../../helpers/test-server';

describe('GET /api/images/history', () => {
  let app: any;

  beforeEach(async () => {
    app = await build();
  });

  it('should return user generation history', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/images/history',
      headers: {
        authorization: 'Bearer test-token',
      },
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should support limit and offset', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/images/history?limit=5&offset=10',
      headers: {
        authorization: 'Bearer test-token',
      },
    });

    expect(response.statusCode).toBe(200);
  });
});
