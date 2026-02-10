import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../../app';
import { db } from '@ai-chat/database';

// Mock the database
vi.mock('@ai-chat/database', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
  users: {
    id: 'id',
    email: 'email',
    role: 'role',
  },
  usageLogs: {
    id: 'id',
    userId: 'userId',
    createdAt: 'createdAt',
    costUsd: 'costUsd',
    model: 'model',
  },
  subscriptions: {
    plan: 'plan',
    status: 'status',
  },
  adminActions: {},
}));

// Mock drizzle-orm functions
vi.mock('drizzle-orm', () => ({
  sql: vi.fn(),
  eq: vi.fn(),
  gte: vi.fn(),
  and: vi.fn(),
  desc: vi.fn(),
  count: vi.fn(),
  sum: vi.fn(),
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

const mockUsageLogs = [
  {
    id: '1',
    userId: 'user-1',
    model: 'gpt-4',
    costUsd: '0.150000',
    createdAt: new Date('2026-02-05'),
  },
  {
    id: '2',
    userId: 'user-2',
    model: 'claude-3-opus',
    costUsd: '0.200000',
    createdAt: new Date('2026-02-06'),
  },
];

describe('Dashboard Overview Endpoint', () => {
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
    adminToken = app.jwt.sign({ userId: mockAdminUser.id });
    userToken = app.jwt.sign({ userId: mockRegularUser.id });
  });

  describe('GET /api/admin/dashboard/overview', () => {
    it('should return 403 for non-authenticated requests', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/dashboard/overview',
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('should return 403 for non-admin users', async () => {
      // Mock user lookup to return regular user
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
        url: '/api/admin/dashboard/overview',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('should return dashboard overview with default period (30d)', async () => {
      // Mock admin user lookup
      const mockUserSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockAdminUser]),
          }),
        }),
      });

      // Mock metrics query
      const mockMetricsSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              totalCosts: '350.50',
              activeUsers: 25,
              totalRequests: 1500,
            },
          ]),
        }),
      });

      // Mock total users query
      const mockTotalUsersSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockResolvedValue([
          {
            totalUsers: 100,
          },
        ]),
      });

      // Mock chart data query
      const mockChartSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([
                { date: '2026-02-01', costs: '145.50' },
                { date: '2026-02-02', costs: '205.00' },
              ]),
            }),
          }),
        }),
      });

      // Mock top users query
      const mockTopUsersSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              groupBy: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([
                    {
                      userId: 'user-1',
                      email: 'user1@example.com',
                      totalCost: '125.50',
                      requestCount: 500,
                    },
                    {
                      userId: 'user-2',
                      email: 'user2@example.com',
                      totalCost: '100.25',
                      requestCount: 400,
                    },
                  ]),
                }),
              }),
            }),
          }),
        }),
      });

      // Mock top models query
      const mockTopModelsSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  {
                    model: 'gpt-4',
                    totalCost: '200.00',
                    requestCount: 800,
                  },
                  {
                    model: 'claude-3-opus',
                    totalCost: '150.50',
                    requestCount: 700,
                  },
                ]),
              }),
            }),
          }),
        }),
      });

      // Mock premium users query
      const mockPremiumSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              count: 5,
            },
          ]),
        }),
      });

      // Setup mock sequence for db.select calls
      vi.mocked(db.select)
        .mockImplementationOnce(mockUserSelect as any) // Admin check
        .mockImplementationOnce(mockMetricsSelect as any) // Metrics
        .mockImplementationOnce(mockTotalUsersSelect as any) // Total users
        .mockImplementationOnce(mockChartSelect as any) // Chart data
        .mockImplementationOnce(mockTopUsersSelect as any) // Top users
        .mockImplementationOnce(mockTopModelsSelect as any) // Top models
        .mockImplementationOnce(mockPremiumSelect as any); // Premium users

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/dashboard/overview',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('metrics');
      expect(body.data).toHaveProperty('costRevenueChart');
      expect(body.data).toHaveProperty('topUsers');
      expect(body.data).toHaveProperty('topModels');

      // Verify metrics structure
      expect(body.data.metrics).toMatchObject({
        totalCosts: expect.any(Number),
        totalRevenue: expect.any(Number),
        totalProfit: expect.any(Number),
        totalUsers: expect.any(Number),
        activeUsers: expect.any(Number),
        totalRequests: expect.any(Number),
      });

      // Verify chart data is an array
      expect(Array.isArray(body.data.costRevenueChart)).toBe(true);
      if (body.data.costRevenueChart.length > 0) {
        expect(body.data.costRevenueChart[0]).toMatchObject({
          date: expect.any(String),
          costs: expect.any(Number),
          revenue: expect.any(Number),
        });
      }

      // Verify top users
      expect(Array.isArray(body.data.topUsers)).toBe(true);
      if (body.data.topUsers.length > 0) {
        expect(body.data.topUsers[0]).toMatchObject({
          userId: expect.any(String),
          email: expect.any(String),
          totalCost: expect.any(Number),
          requestCount: expect.any(Number),
        });
      }

      // Verify top models
      expect(Array.isArray(body.data.topModels)).toBe(true);
      if (body.data.topModels.length > 0) {
        expect(body.data.topModels[0]).toMatchObject({
          model: expect.any(String),
          totalCost: expect.any(Number),
          requestCount: expect.any(Number),
        });
      }
    });

    it('should accept different period parameters', async () => {
      const periods = ['7d', '30d', '90d'];

      for (const period of periods) {
        // Mock admin user lookup
        const mockUserSelect = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockAdminUser]),
            }),
          }),
        });

        // Mock all required queries with minimal data
        const mockEmptyResult = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([]),
            }),
            groupBy: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

        const mockCountResult = vi.fn().mockReturnValue({
          from: vi.fn().mockResolvedValue([{ totalUsers: 0 }]),
        });

        const mockMetricsResult = vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              {
                totalCosts: '0',
                activeUsers: 0,
                totalRequests: 0,
              },
            ]),
          }),
        });

        vi.mocked(db.select)
          .mockImplementationOnce(mockUserSelect as any)
          .mockImplementationOnce(mockMetricsResult as any)
          .mockImplementationOnce(mockCountResult as any)
          .mockImplementationOnce(mockEmptyResult as any)
          .mockImplementationOnce(mockEmptyResult as any)
          .mockImplementationOnce(mockEmptyResult as any)
          .mockImplementationOnce(mockEmptyResult as any);

        const response = await app.inject({
          method: 'GET',
          url: `/api/admin/dashboard/overview?period=${period}`,
          headers: {
            authorization: `Bearer ${adminToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
      }
    });

    it('should return 400 for invalid period parameter', async () => {
      // Mock admin user lookup
      const mockUserSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockAdminUser]),
          }),
        }),
      });

      vi.mocked(db.select).mockImplementation(mockUserSelect as any);

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/dashboard/overview?period=invalid',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle database errors gracefully', async () => {
      // Mock admin user lookup
      const mockUserSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockAdminUser]),
          }),
        }),
      });

      // Mock database error
      const mockErrorSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockUserSelect as any)
        .mockImplementationOnce(mockErrorSelect as any);

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/dashboard/overview',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });

    it('should handle empty database results', async () => {
      // Mock admin user lookup
      const mockUserSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockAdminUser]),
          }),
        }),
      });

      // Mock all queries to return empty results
      const mockEmptyResult = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
          groupBy: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const mockCountResult = vi.fn().mockReturnValue({
        from: vi.fn().mockResolvedValue([{ totalUsers: 0 }]),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockUserSelect as any)
        .mockImplementationOnce(mockEmptyResult as any)
        .mockImplementationOnce(mockCountResult as any)
        .mockImplementationOnce(mockEmptyResult as any)
        .mockImplementationOnce(mockEmptyResult as any)
        .mockImplementationOnce(mockEmptyResult as any)
        .mockImplementationOnce(mockEmptyResult as any);

      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/dashboard/overview',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(true);
      expect(body.data.metrics.totalCosts).toBe(0);
      expect(body.data.metrics.totalUsers).toBe(0);
      expect(body.data.metrics.activeUsers).toBe(0);
      expect(body.data.topUsers).toEqual([]);
      expect(body.data.topModels).toEqual([]);
    });
  });
});
