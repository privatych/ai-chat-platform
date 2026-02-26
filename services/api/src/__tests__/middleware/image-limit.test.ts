import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkImageLimit, getUsageToday } from '../../middleware/image-limit';
import { db, imageGenerations, users } from '@ai-chat/database';
import { sql, eq, and, gte } from 'drizzle-orm';

// Mock the database
vi.mock('@ai-chat/database', () => ({
  db: {
    select: vi.fn(),
  },
  imageGenerations: {
    userId: 'user_id',
    createdAt: 'created_at',
  },
  users: {
    id: 'id',
    subscriptionTier: 'subscription_tier',
  },
}));

describe('Image Rate Limiting Middleware', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUsageToday', () => {
    it('should return usage count for the current day', async () => {
      // Mock the count query
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 5 }])
        })
      });
      (db.select as any) = mockSelect;

      const count = await getUsageToday(mockUserId);

      expect(count).toBe(5);
      expect(mockSelect).toHaveBeenCalledWith({
        count: expect.any(Object), // sql`count(*)`
      });
    });

    it('should return 0 when no images generated today', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 0 }])
        })
      });
      (db.select as any) = mockSelect;

      const count = await getUsageToday(mockUserId);

      expect(count).toBe(0);
    });
  });

  describe('checkImageLimit', () => {
    it('should pass when user is under limit (free tier)', async () => {
      // Mock user query - free tier
      const mockUserSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ subscriptionTier: 'free' }])
        })
      });

      // Mock count query - 5 images today (under 10 limit)
      const mockCountSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 5 }])
        })
      });

      (db.select as any) = vi.fn()
        .mockReturnValueOnce(mockUserSelect()) // First call for user
        .mockReturnValueOnce(mockCountSelect()); // Second call for count

      await expect(checkImageLimit(mockUserId)).resolves.not.toThrow();
    });

    it('should throw DAILY_LIMIT_REACHED when at limit (free tier)', async () => {
      // Mock user query - free tier
      const mockUserSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ subscriptionTier: 'free' }])
        })
      });

      // Mock count query - 10 images today (at limit)
      const mockCountSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 10 }])
        })
      });

      (db.select as any) = vi.fn()
        .mockReturnValueOnce(mockUserSelect())
        .mockReturnValueOnce(mockCountSelect());

      await expect(checkImageLimit(mockUserId)).rejects.toThrow('DAILY_LIMIT_REACHED');
    });

    it('should pass for premium tier with higher limit', async () => {
      // Mock user query - premium tier
      const mockUserSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ subscriptionTier: 'premium' }])
        })
      });

      // Mock count query - 25 images today (under 30 limit)
      const mockCountSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 25 }])
        })
      });

      (db.select as any) = vi.fn()
        .mockReturnValueOnce(mockUserSelect())
        .mockReturnValueOnce(mockCountSelect());

      await expect(checkImageLimit(mockUserId)).resolves.not.toThrow();
    });

    it('should throw DAILY_LIMIT_REACHED when premium tier at limit', async () => {
      // Mock user query - premium tier
      const mockUserSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ subscriptionTier: 'premium' }])
        })
      });

      // Mock count query - 30 images today (at limit)
      const mockCountSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 30 }])
        })
      });

      (db.select as any) = vi.fn()
        .mockReturnValueOnce(mockUserSelect())
        .mockReturnValueOnce(mockCountSelect());

      await expect(checkImageLimit(mockUserId)).rejects.toThrow('DAILY_LIMIT_REACHED');
    });

    it('should throw error when user not found', async () => {
      // Mock user query - user not found
      const mockUserSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]) // Empty array = no user
        })
      });

      (db.select as any) = mockUserSelect;

      await expect(checkImageLimit(mockUserId)).rejects.toThrow();
    });
  });
});
