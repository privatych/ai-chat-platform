import { describe, it, expect, vi, beforeEach } from 'vitest';
import { build } from '../../helpers/test-server';
import * as openrouterImage from '../../../services/openrouter-image';
import * as imageStorage from '../../../services/image-storage';
import * as imageLimit from '../../../middleware/image-limit';

vi.mock('../../../services/openrouter-image');
vi.mock('../../../services/image-storage');
vi.mock('../../../middleware/image-limit');

describe('POST /api/images/generate', () => {
  let app: any;

  beforeEach(async () => {
    app = await build();
    vi.clearAllMocks();
  });

  it('should generate image successfully', async () => {
    vi.mocked(imageLimit.checkImageLimit).mockResolvedValue(undefined);
    vi.mocked(openrouterImage.generateImage).mockResolvedValue({
      imageUrl: 'https://temp.com/img.png',
      cost: 0.003,
    });
    vi.mocked(imageStorage.saveImage).mockResolvedValue('/uploads/images/user/img.png');

    const response = await app.inject({
      method: 'POST',
      url: '/api/images/generate',
      headers: {
        authorization: 'Bearer test-token',
      },
      payload: {
        model: 'flux-1-schnell',
        prompt: 'A beautiful sunset',
        width: 1024,
        height: 1024,
      },
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body);
    expect(data.success).toBe(true);
    expect(data.data.imageUrl).toContain('/uploads/images/');
  });

  it('should return 400 if prompt is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/images/generate',
      headers: {
        authorization: 'Bearer test-token',
      },
      payload: {
        model: 'flux-1-schnell',
        width: 1024,
        height: 1024,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 429 if daily limit reached', async () => {
    vi.mocked(imageLimit.checkImageLimit).mockRejectedValue(
      new Error('DAILY_LIMIT_REACHED')
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/images/generate',
      headers: {
        authorization: 'Bearer test-token',
      },
      payload: {
        model: 'flux-1-schnell',
        prompt: 'Test',
        width: 1024,
        height: 1024,
      },
    });

    expect(response.statusCode).toBe(429);
  });

  it('should return 403 if model not allowed for tier', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/images/generate',
      headers: {
        authorization: 'Bearer test-token',
      },
      payload: {
        model: 'flux-2-max', // Premium only
        prompt: 'Test',
        width: 1024,
        height: 1024,
      },
    });

    expect(response.statusCode).toBe(403);
  });
});
