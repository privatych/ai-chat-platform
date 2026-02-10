import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateCost, logUsage } from '../../utils/usage-logger';
import { db, modelPricing, usageLogs } from '@ai-chat/database';
import { eq } from 'drizzle-orm';

// Mock the database
vi.mock('@ai-chat/database', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
  modelPricing: {
    modelId: 'modelId',
  },
  usageLogs: {},
  eq: vi.fn(),
}));

describe('Usage Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateCost', () => {
    it('should calculate cost correctly for a valid model', async () => {
      // Mock the database query to return pricing data
      const mockPricing = {
        modelId: 'gpt-4-turbo',
        pricePerInputToken: '0.0000100000',  // $0.01 per 1000 tokens
        pricePerOutputToken: '0.0000300000', // $0.03 per 1000 tokens
        isActive: true,
      };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockPricing]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const cost = await calculateCost('gpt-4-turbo', 1000, 500);

      // Expected: (1000 * 0.00001) + (500 * 0.00003) = 0.01 + 0.015 = 0.025
      expect(cost).toBe(0.025);
      expect(db.select).toHaveBeenCalled();
    });

    it('should throw error for unknown model', async () => {
      // Mock the database query to return empty array
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      await expect(calculateCost('unknown-model', 1000, 500)).rejects.toThrow(
        'Model pricing not found for: unknown-model'
      );
    });

    it('should calculate cost correctly with zero tokens', async () => {
      const mockPricing = {
        modelId: 'gpt-4-turbo',
        pricePerInputToken: '0.0000100000',
        pricePerOutputToken: '0.0000300000',
        isActive: true,
      };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockPricing]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const cost = await calculateCost('gpt-4-turbo', 0, 0);

      expect(cost).toBe(0);
    });

    it('should handle large token counts', async () => {
      const mockPricing = {
        modelId: 'claude-3-opus',
        pricePerInputToken: '0.0000150000',
        pricePerOutputToken: '0.0000750000',
        isActive: true,
      };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockPricing]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const cost = await calculateCost('claude-3-opus', 100000, 50000);

      // Expected: (100000 * 0.000015) + (50000 * 0.000075) = 1.5 + 3.75 = 5.25
      expect(cost).toBe(5.25);
    });
  });

  describe('logUsage', () => {
    it('should create a database record with correct data', async () => {
      const mockPricing = {
        modelId: 'gpt-4-turbo',
        pricePerInputToken: '0.0000100000',
        pricePerOutputToken: '0.0000300000',
        isActive: true,
      };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockPricing]),
      };

      const mockUsageLog = {
        id: 'test-id',
        userId: 'user-123',
        eventType: 'chat_message',
        model: 'gpt-4-turbo',
        tokensInput: 1000,
        tokensOutput: 500,
        tokensTotal: 1500,
        costUsd: '0.025000',
        metadata: null,
        createdAt: new Date(),
      };

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUsageLog]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);
      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      const result = await logUsage({
        userId: 'user-123',
        eventType: 'chat_message',
        model: 'gpt-4-turbo',
        tokensInput: 1000,
        tokensOutput: 500,
      });

      expect(result).toEqual(mockUsageLog);
      expect(db.insert).toHaveBeenCalledWith(usageLogs);
      expect(mockInsert.values).toHaveBeenCalledWith({
        userId: 'user-123',
        eventType: 'chat_message',
        model: 'gpt-4-turbo',
        tokensInput: 1000,
        tokensOutput: 500,
        tokensTotal: 1500,
        costUsd: '0.025000',
        metadata: null,
      });
    });

    it('should calculate cost correctly using calculateCost', async () => {
      const mockPricing = {
        modelId: 'claude-3-opus',
        pricePerInputToken: '0.0000150000',
        pricePerOutputToken: '0.0000750000',
        isActive: true,
      };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockPricing]),
      };

      const mockUsageLog = {
        id: 'test-id-2',
        userId: 'user-456',
        eventType: 'chat_message',
        model: 'claude-3-opus',
        tokensInput: 2000,
        tokensOutput: 1000,
        tokensTotal: 3000,
        costUsd: '0.105000',
        metadata: null,
        createdAt: new Date(),
      };

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUsageLog]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);
      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      const result = await logUsage({
        userId: 'user-456',
        eventType: 'chat_message',
        model: 'claude-3-opus',
        tokensInput: 2000,
        tokensOutput: 1000,
      });

      // Cost: (2000 * 0.000015) + (1000 * 0.000075) = 0.03 + 0.075 = 0.105
      expect(result.costUsd).toBe('0.105000');
      expect(result.tokensTotal).toBe(3000);
    });

    it('should handle metadata correctly', async () => {
      const mockPricing = {
        modelId: 'gpt-4-turbo',
        pricePerInputToken: '0.0000100000',
        pricePerOutputToken: '0.0000300000',
        isActive: true,
      };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockPricing]),
      };

      const metadata = {
        chatId: 'chat-789',
        projectId: 'project-123',
        responseTime: 1500,
      };

      const mockUsageLog = {
        id: 'test-id-3',
        userId: 'user-789',
        eventType: 'chat_message',
        model: 'gpt-4-turbo',
        tokensInput: 500,
        tokensOutput: 250,
        tokensTotal: 750,
        costUsd: '0.012500',
        metadata,
        createdAt: new Date(),
      };

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUsageLog]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);
      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      const result = await logUsage({
        userId: 'user-789',
        eventType: 'chat_message',
        model: 'gpt-4-turbo',
        tokensInput: 500,
        tokensOutput: 250,
        metadata,
      });

      expect(result.metadata).toEqual(metadata);
      expect(mockInsert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata,
        })
      );
    });

    it('should throw error when model pricing not found', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      await expect(
        logUsage({
          userId: 'user-123',
          eventType: 'chat_message',
          model: 'unknown-model',
          tokensInput: 1000,
          tokensOutput: 500,
        })
      ).rejects.toThrow('Model pricing not found for: unknown-model');
    });

    it('should handle different event types', async () => {
      const mockPricing = {
        modelId: 'dall-e-3',
        pricePerInputToken: '0.0000000000',
        pricePerOutputToken: '0.0400000000',
        isActive: true,
      };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockPricing]),
      };

      const mockUsageLog = {
        id: 'test-id-4',
        userId: 'user-999',
        eventType: 'image_generation',
        model: 'dall-e-3',
        tokensInput: 0,
        tokensOutput: 1,
        tokensTotal: 1,
        costUsd: '0.040000',
        metadata: { resolution: '1024x1024' },
        createdAt: new Date(),
      };

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUsageLog]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);
      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      const result = await logUsage({
        userId: 'user-999',
        eventType: 'image_generation',
        model: 'dall-e-3',
        tokensInput: 0,
        tokensOutput: 1,
        metadata: { resolution: '1024x1024' },
      });

      expect(result.eventType).toBe('image_generation');
      expect(result.costUsd).toBe('0.040000');
    });
  });
});
