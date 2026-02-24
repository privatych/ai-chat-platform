import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateImage, calculateCost } from '../../services/openrouter-image';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = axios as any;

describe('OpenRouter Image Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  describe('generateImage', () => {
    it('should generate image successfully', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          data: [{
            url: 'https://temp-url.com/image.png',
          }],
        },
      });

      const result = await generateImage({
        model: 'flux-1-schnell',
        prompt: 'A beautiful sunset',
        width: 1024,
        height: 1024,
      });

      expect(result.imageUrl).toBe('https://temp-url.com/image.png');
      expect(result.cost).toBeGreaterThan(0);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/images/generations',
        expect.objectContaining({
          model: 'flux-1-schnell',
          prompt: 'A beautiful sunset',
          width: 1024,
          height: 1024,
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key',
          }),
        })
      );
    });

    it('should throw RATE_LIMIT_EXCEEDED on 429', async () => {
      mockedAxios.post.mockRejectedValue({
        response: { status: 429 },
      });

      await expect(generateImage({
        model: 'flux-1-schnell',
        prompt: 'Test',
        width: 1024,
        height: 1024,
      })).rejects.toThrow('RATE_LIMIT_EXCEEDED');
    });

    it('should throw INSUFFICIENT_CREDITS on 402', async () => {
      mockedAxios.post.mockRejectedValue({
        response: { status: 402 },
      });

      await expect(generateImage({
        model: 'flux-1-schnell',
        prompt: 'Test',
        width: 1024,
        height: 1024,
      })).rejects.toThrow('INSUFFICIENT_CREDITS');
    });
  });

  describe('calculateCost', () => {
    it('should calculate cost correctly for 1024x1024', () => {
      const cost = calculateCost('flux-2-pro', 1024, 1024);
      expect(cost).toBeCloseTo(0.03, 2);
    });

    it('should calculate cost for 2048x2048 (4 megapixels)', () => {
      const cost = calculateCost('flux-1-schnell', 2048, 2048);
      expect(cost).toBeCloseTo(0.012, 2);
    });
  });
});
