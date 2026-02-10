import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../../../app';
import { db } from '@ai-chat/database';

// Mock the database
vi.mock('@ai-chat/database', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
  users: {
    id: 'id',
    email: 'email',
    fullName: 'fullName',
    avatarUrl: 'avatarUrl',
    role: 'role',
    subscriptionTier: 'subscriptionTier',
    subscriptionExpiresAt: 'subscriptionExpiresAt',
    isBlocked: 'isBlocked',
    blockedReason: 'blockedReason',
    blockedAt: 'blockedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  usageLogs: {
    id: 'id',
    userId: 'userId',
    eventType: 'eventType',
    model: 'model',
    tokensInput: 'tokensInput',
    tokensOutput: 'tokensOutput',
    tokensTotal: 'tokensTotal',
    costUsd: 'costUsd',
    metadata: 'metadata',
    createdAt: 'createdAt',
  },
  adminActions: {},
}));

// Mock drizzle-orm functions
vi.mock('drizzle-orm', () => ({
  sql: vi.fn((strings: TemplateStringsArray, ...values: any[]) => ({
    _type: 'sql',
    strings,
    values,
  })),
  eq: vi.fn((col, val) => ({ _type: 'eq', col, val })),
  and: vi.fn((...conditions) => ({ _type: 'and', conditions })),
  or: vi.fn((...conditions) => ({ _type: 'or', conditions })),
  ilike: vi.fn((col, val) => ({ _type: 'ilike', col, val })),
  desc: vi.fn((col) => ({ _type: 'desc', col })),
  count: vi.fn(() => ({ _type: 'count' })),
  sum: vi.fn((col) => ({ _type: 'sum', col })),
}));

// Mock data
const mockAdminUser = {
  id: 'admin-123',
  email: 'admin@example.com',
  role: 'admin',
};

const mockRegularUser = {
  id: 'user-123',
  email: 'user@example.com',
  role: 'user',
};

const mockTargetUser = {
  id: 'target-456',
  email: 'target@example.com',
  fullName: 'Target User',
  avatarUrl: null,
  role: 'user',
  subscriptionTier: 'free',
  subscriptionExpiresAt: null,
  isBlocked: false,
  blockedReason: null,
  blockedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

// Helper function to setup admin authentication mocks
function setupAdminMocks() {
  // Mock admin user lookup
  const mockUserSelect = vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([mockAdminUser]),
      }),
    }),
  });

  // Setup admin action logging insert mock
  const mockInsert = vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{}]),
    }),
  });

  vi.mocked(db.insert).mockImplementation(mockInsert as any);

  return { mockUserSelect, mockInsert };
}

describe('User Management Endpoints', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup default admin insert mock (used by requireAdmin middleware)
    const defaultInsertMock = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{}]),
      }),
    });
    vi.mocked(db.insert).mockImplementation(defaultInsertMock as any);

    app = await buildApp();
    await app.ready();

    // Generate test tokens
    adminToken = app.jwt.sign({
      userId: mockAdminUser.id,
      email: mockAdminUser.email,
      subscriptionTier: 'premium',
    });
    userToken = app.jwt.sign({
      userId: mockRegularUser.id,
      email: mockRegularUser.email,
      subscriptionTier: 'free',
    });
  });

  describe('GET /api/admin/users', () => {
    it('should return 401 for non-authenticated requests', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/users',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
    });

    it('should return 403 for non-admin users', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockRegularUser]),
          }),
        }),
      });
      vi.mocked(db.select).mockImplementation(mockSelect as any);

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/users',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('should return paginated list of users with default parameters', async () => {
      const { mockUserSelect } = setupAdminMocks();

      // Mock total count query
      const mockCountSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 50 }]),
        }),
      });

      // Mock users list query
      const mockUsersSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue([
                  mockTargetUser,
                  { ...mockTargetUser, id: 'user-789', email: 'user2@example.com' },
                ]),
              }),
            }),
          }),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockUserSelect as any) // Admin check
        .mockImplementationOnce(mockCountSelect as any) // Count
        .mockImplementationOnce(mockUsersSelect as any); // Users list

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/users',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(true);
      expect(body.data.users).toHaveLength(2);
      expect(body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3,
      });
      expect(body.data.users[0]).toMatchObject({
        id: mockTargetUser.id,
        email: mockTargetUser.email,
        role: mockTargetUser.role,
      });
    });

    it('should filter users by search term', async () => {
      const { mockUserSelect } = setupAdminMocks();

      const mockCountSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      const mockUsersSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue([mockTargetUser]),
              }),
            }),
          }),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockUserSelect as any)
        .mockImplementationOnce(mockCountSelect as any)
        .mockImplementationOnce(mockUsersSelect as any);

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/users?search=target',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.users).toHaveLength(1);
    });

    it('should filter users by role', async () => {
      const { mockUserSelect } = setupAdminMocks();

      const mockCountSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 5 }]),
        }),
      });

      const adminUserWithDates = {
        ...mockAdminUser,
        fullName: 'Admin User',
        avatarUrl: null,
        subscriptionTier: 'premium',
        subscriptionExpiresAt: null,
        isBlocked: false,
        blockedReason: null,
        blockedAt: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      };

      const mockUsersSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue([adminUserWithDates]),
              }),
            }),
          }),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockUserSelect as any)
        .mockImplementationOnce(mockCountSelect as any)
        .mockImplementationOnce(mockUsersSelect as any);

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/users?role=admin',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    it('should filter users by blocked status', async () => {
      const { mockUserSelect } = setupAdminMocks();

      const mockCountSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 3 }]),
        }),
      });

      const blockedUser = { ...mockTargetUser, isBlocked: true };
      const mockUsersSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue([blockedUser]),
              }),
            }),
          }),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockUserSelect as any)
        .mockImplementationOnce(mockCountSelect as any)
        .mockImplementationOnce(mockUsersSelect as any);

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/users?status=blocked',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    it('should support custom pagination parameters', async () => {
      const { mockUserSelect } = setupAdminMocks();

      const mockCountSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 100 }]),
        }),
      });

      const mockUsersSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockUserSelect as any)
        .mockImplementationOnce(mockCountSelect as any)
        .mockImplementationOnce(mockUsersSelect as any);

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/users?page=2&limit=50',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.pagination).toEqual({
        page: 2,
        limit: 50,
        total: 100,
        totalPages: 2,
      });
    });

    it('should return 400 for invalid query parameters', async () => {
      const { mockUserSelect } = setupAdminMocks();
      vi.mocked(db.select).mockImplementation(mockUserSelect as any);

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/users?page=0',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/admin/users/:userId', () => {
    it('should return user details with stats and recent activity', async () => {
      const { mockUserSelect } = setupAdminMocks();

      // Mock user details query
      const mockUserDetailsSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockTargetUser]),
          }),
        }),
      });

      // Mock stats query
      const mockStatsSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              totalSpent: '125.50',
              requestCount: 500,
              lastActive: '2026-02-09T10:00:00.000Z',
            },
          ]),
        }),
      });

      // Mock recent activity query
      const mockActivitySelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: 'log-1',
                  eventType: 'chat_message',
                  model: 'gpt-4',
                  tokensInput: 100,
                  tokensOutput: 200,
                  tokensTotal: 300,
                  costUsd: '0.05',
                  metadata: {},
                  createdAt: new Date('2026-02-09T10:00:00.000Z'),
                },
              ]),
            }),
          }),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockUserSelect as any) // Admin check
        .mockImplementationOnce(mockUserDetailsSelect as any) // User details
        .mockImplementationOnce(mockStatsSelect as any) // Stats
        .mockImplementationOnce(mockActivitySelect as any); // Activity

      const response = await app.inject({
        method: 'GET',
        url: `/api/admin/users/${mockTargetUser.id}`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(true);
      expect(body.data.user).toMatchObject({
        id: mockTargetUser.id,
        email: mockTargetUser.email,
        role: mockTargetUser.role,
      });
      expect(body.data.stats).toMatchObject({
        totalSpent: 125.5,
        requestCount: 500,
        lastActive: '2026-02-09T10:00:00.000Z',
      });
      expect(body.data.recentActivity).toHaveLength(1);
      expect(body.data.recentActivity[0]).toMatchObject({
        id: 'log-1',
        eventType: 'chat_message',
        model: 'gpt-4',
        costUsd: 0.05,
      });
    });

    it('should return 404 for non-existent user', async () => {
      const { mockUserSelect } = setupAdminMocks();

      const mockUserDetailsSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const mockStatsSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const mockActivitySelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockUserSelect as any)
        .mockImplementationOnce(mockUserDetailsSelect as any)
        .mockImplementationOnce(mockStatsSelect as any)
        .mockImplementationOnce(mockActivitySelect as any);

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/users/non-existent-id',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('PATCH /api/admin/users/:userId/role', () => {
    it('should successfully update user role', async () => {
      const { mockUserSelect, mockInsert } = setupAdminMocks();

      // Mock user lookup
      const mockTargetUserSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockTargetUser]),
          }),
        }),
      });

      // Mock update
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockUserSelect as any) // Admin check
        .mockImplementationOnce(mockTargetUserSelect as any); // Target user lookup

      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/admin/users/${mockTargetUser.id}/role`,
        headers: {
          authorization: `Bearer ${adminToken}`,
          'content-type': 'application/json',
        },
        payload: {
          role: 'premiumuser',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        userId: mockTargetUser.id,
        oldRole: 'user',
        newRole: 'premiumuser',
      });

      // Verify admin action was logged
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should prevent admin from changing their own role', async () => {
      const { mockUserSelect } = setupAdminMocks();
      vi.mocked(db.select).mockImplementation(mockUserSelect as any);

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/admin/users/${mockAdminUser.id}/role`,
        headers: {
          authorization: `Bearer ${adminToken}`,
          'content-type': 'application/json',
        },
        payload: {
          role: 'user',
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toContain('own role');
    });

    it('should return 404 for non-existent user', async () => {
      const { mockUserSelect } = setupAdminMocks();

      const mockTargetUserSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockUserSelect as any)
        .mockImplementationOnce(mockTargetUserSelect as any);

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/admin/users/non-existent-id/role',
        headers: {
          authorization: `Bearer ${adminToken}`,
          'content-type': 'application/json',
        },
        payload: {
          role: 'admin',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should return 400 for invalid role', async () => {
      const { mockUserSelect } = setupAdminMocks();
      vi.mocked(db.select).mockImplementation(mockUserSelect as any);

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/admin/users/${mockTargetUser.id}/role`,
        headers: {
          authorization: `Bearer ${adminToken}`,
          'content-type': 'application/json',
        },
        payload: {
          role: 'invalid',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /api/admin/users/:userId/block', () => {
    it('should successfully block a user with reason', async () => {
      const { mockUserSelect, mockInsert } = setupAdminMocks();

      // Mock user lookup
      const mockTargetUserSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockTargetUser]),
          }),
        }),
      });

      // Mock update
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockUserSelect as any)
        .mockImplementationOnce(mockTargetUserSelect as any);

      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/admin/users/${mockTargetUser.id}/block`,
        headers: {
          authorization: `Bearer ${adminToken}`,
          'content-type': 'application/json',
        },
        payload: {
          blocked: true,
          reason: 'Violation of terms',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        userId: mockTargetUser.id,
        blocked: true,
        reason: 'Violation of terms',
      });

      // Verify admin action was logged
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should successfully unblock a user', async () => {
      const { mockUserSelect, mockInsert } = setupAdminMocks();

      const blockedUser = { ...mockTargetUser, isBlocked: true };
      const mockTargetUserSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([blockedUser]),
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockUserSelect as any)
        .mockImplementationOnce(mockTargetUserSelect as any);

      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/admin/users/${mockTargetUser.id}/block`,
        headers: {
          authorization: `Bearer ${adminToken}`,
          'content-type': 'application/json',
        },
        payload: {
          blocked: false,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        userId: mockTargetUser.id,
        blocked: false,
        reason: null,
      });
    });

    it('should require reason when blocking', async () => {
      const { mockUserSelect } = setupAdminMocks();

      // Mock user lookup (needed for validation check before block logic)
      const mockTargetUserSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockTargetUser]),
          }),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockUserSelect as any)
        .mockImplementationOnce(mockTargetUserSelect as any);

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/admin/users/${mockTargetUser.id}/block`,
        headers: {
          authorization: `Bearer ${adminToken}`,
          'content-type': 'application/json',
        },
        payload: {
          blocked: true,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message.toLowerCase()).toContain('reason');
    });

    it('should prevent admin from blocking themselves', async () => {
      const { mockUserSelect, mockInsert } = setupAdminMocks();
      vi.mocked(db.select).mockImplementation(mockUserSelect as any);

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/admin/users/${mockAdminUser.id}/block`,
        headers: {
          authorization: `Bearer ${adminToken}`,
          'content-type': 'application/json',
        },
        payload: {
          blocked: true,
          reason: 'Test',
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN');
      // The endpoint checks userId === adminUserId before database lookup
      // In this test, the check happens and returns FORBIDDEN
      expect(body.error.message).toBeTruthy();
    });

    it('should return 404 for non-existent user', async () => {
      const { mockUserSelect } = setupAdminMocks();

      const mockTargetUserSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockUserSelect as any)
        .mockImplementationOnce(mockTargetUserSelect as any);

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/admin/users/non-existent-id/block',
        headers: {
          authorization: `Bearer ${adminToken}`,
          'content-type': 'application/json',
        },
        payload: {
          blocked: true,
          reason: 'Test',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('USER_NOT_FOUND');
    });
  });
});
