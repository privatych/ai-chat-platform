import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requireAdmin } from '../../middleware/admin-auth';
import { db, adminActions, users } from '@ai-chat/database';
import { FastifyRequest, FastifyReply } from 'fastify';

// Mock the database
vi.mock('@ai-chat/database', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
  adminActions: {},
  users: {
    id: 'id',
    role: 'role',
  },
  eq: vi.fn(),
}));

describe('Admin Auth Middleware', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock reply methods
    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    // Mock request
    mockRequest = {
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'Mozilla/5.0 (Test Agent)',
      },
    };
  });

  describe('Authentication checks', () => {
    it('should reject unauthenticated requests', async () => {
      // No user object in request
      mockRequest.user = undefined;

      await requireAdmin(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.code).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      });
    });

    it('should reject requests without userId in user object', async () => {
      // User object exists but no userId
      mockRequest.user = {} as any;

      await requireAdmin(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.code).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      });
    });
  });

  describe('Authorization checks', () => {
    it('should reject non-admin users (regular user)', async () => {
      // Mock authenticated user but not admin
      mockRequest.user = {
        userId: 'user-123',
        email: 'user@example.com',
        subscriptionTier: 'free',
      };

      // Mock database query to return user with role='user'
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 'user-123', role: 'user' }]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      await requireAdmin(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.code).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      });
    });

    it('should reject premium users (not admin)', async () => {
      // Mock authenticated user with premium role
      mockRequest.user = {
        userId: 'user-456',
        email: 'premium@example.com',
        subscriptionTier: 'premium',
      };

      // Mock database query to return user with role='premiumuser'
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 'user-456', role: 'premiumuser' }]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      await requireAdmin(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.code).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      });
    });

    it('should reject when user not found in database', async () => {
      mockRequest.user = {
        userId: 'user-999',
        email: 'notfound@example.com',
        subscriptionTier: 'free',
      };

      // Mock database query to return empty array (user not found)
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      await requireAdmin(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.code).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      });
    });
  });

  describe('Admin access', () => {
    it('should allow admin users to proceed', async () => {
      // Mock authenticated admin user
      mockRequest.user = {
        userId: 'admin-123',
        email: 'admin@example.com',
        subscriptionTier: 'premium',
      };

      // Mock database query to return user with role='admin'
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 'admin-123', role: 'admin' }]),
      };

      // Mock insert for admin action logging
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: 'action-123',
          adminId: 'admin-123',
          action: 'ADMIN_ACCESS',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 (Test Agent)',
          createdAt: new Date(),
        }]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);
      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      await requireAdmin(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // Should not call reply.code or reply.send (allows request to continue)
      expect(mockReply.code).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();

      // Should log admin action
      expect(db.insert).toHaveBeenCalledWith(adminActions);
      expect(mockInsert.values).toHaveBeenCalled();
    });
  });

  describe('Admin action logging', () => {
    it('should log admin action with correct details', async () => {
      mockRequest.user = {
        userId: 'admin-789',
        email: 'superadmin@example.com',
        subscriptionTier: 'premium',
      };

      mockRequest.method = 'GET';
      mockRequest.url = '/api/admin/dashboard';

      // Mock database query
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 'admin-789', role: 'admin' }]),
      };

      // Mock insert for admin action logging
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: 'action-789',
          adminId: 'admin-789',
          action: 'ADMIN_ACCESS',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 (Test Agent)',
          details: {
            method: 'GET',
            url: '/api/admin/dashboard',
          },
          createdAt: new Date(),
        }]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);
      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      await requireAdmin(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockInsert.values).toHaveBeenCalledWith({
        adminId: 'admin-789',
        action: 'ADMIN_ACCESS',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Test Agent)',
        details: {
          method: 'GET',
          url: '/api/admin/dashboard',
        },
      });
    });

    it('should handle missing IP address', async () => {
      mockRequest.user = {
        userId: 'admin-111',
        email: 'admin@example.com',
        subscriptionTier: 'premium',
      };

      mockRequest.ip = undefined;
      mockRequest.method = 'POST';
      mockRequest.url = '/api/admin/users';

      // Mock database query
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 'admin-111', role: 'admin' }]),
      };

      // Mock insert
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: 'action-111',
          adminId: 'admin-111',
          action: 'ADMIN_ACCESS',
          ipAddress: null,
          userAgent: 'Mozilla/5.0 (Test Agent)',
          createdAt: new Date(),
        }]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);
      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      await requireAdmin(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockInsert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: undefined,
        })
      );
    });

    it('should handle missing user-agent header', async () => {
      mockRequest.user = {
        userId: 'admin-222',
        email: 'admin@example.com',
        subscriptionTier: 'premium',
      };

      mockRequest.headers = {};

      // Mock database query
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 'admin-222', role: 'admin' }]),
      };

      // Mock insert
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: 'action-222',
          adminId: 'admin-222',
          action: 'ADMIN_ACCESS',
          ipAddress: '127.0.0.1',
          userAgent: null,
          createdAt: new Date(),
        }]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);
      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      await requireAdmin(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockInsert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: undefined,
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should handle database errors during role check', async () => {
      mockRequest.user = {
        userId: 'admin-999',
        email: 'admin@example.com',
        subscriptionTier: 'premium',
      };

      // Mock database query to throw error
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockRejectedValue(new Error('Database connection failed')),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      await requireAdmin(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.code).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      });
    });

    it('should continue even if audit logging fails', async () => {
      mockRequest.user = {
        userId: 'admin-333',
        email: 'admin@example.com',
        subscriptionTier: 'premium',
      };

      // Mock database query for role check
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 'admin-333', role: 'admin' }]),
      };

      // Mock insert to fail (audit log error)
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockRejectedValue(new Error('Insert failed')),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);
      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      await requireAdmin(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // Should still allow admin access even if logging fails
      expect(mockReply.code).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });
  });
});
