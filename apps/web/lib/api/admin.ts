const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper to get auth token
function getAuthToken(): string | null {
  // Get from localStorage
  return localStorage.getItem('auth_token');
}

// Helper for authenticated requests
async function authFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Request failed');
  }

  const result = await response.json();
  // API returns { success: true, data: T }, so unwrap the data
  return result.data || result;
}

// Dashboard Types
export interface DashboardMetrics {
  totalCosts: number;
  totalRevenue: number;
  totalProfit: number;
  totalUsers: number;
  activeUsers: number;
  totalRequests: number;
}

export interface CostRevenueDataPoint {
  date: string;
  costs: number;
  revenue: number;
}

export interface TopUser {
  userId: string;
  email: string;
  totalCost: number;
  requestCount: number;
}

export interface TopModel {
  model: string;
  totalCost: number;
  requestCount: number;
}

export interface DashboardOverview {
  metrics: DashboardMetrics;
  costRevenueChart: CostRevenueDataPoint[];
  topUsers: TopUser[];
  topModels: TopModel[];
}

// User Types
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'premiumuser' | 'user';
  isBlocked: boolean;
  blockedReason?: string;
  blockedAt?: string;
  createdAt: string;
}

export interface UserStats {
  totalSpent: number;
  requestCount: number;
  lastActive: string | null;
}

export interface RecentActivity {
  id: string;
  eventType: string;
  model: string;
  tokensTotal: number;
  costUsd: number;
  createdAt: string;
}

export interface UserDetails extends User {
  stats: UserStats;
  recentActivity: RecentActivity[];
}

export interface UsersListParams {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface UsersListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateRoleResponse {
  success: boolean;
}

export interface BlockUserResponse {
  success: boolean;
}

// API methods
export const adminApi = {
  dashboard: {
    /**
     * Get dashboard overview with metrics, charts, and top users/models
     * @param period - Time period for data aggregation ('7d', '30d', or '90d')
     * @returns Dashboard overview data
     */
    getOverview: (period: '7d' | '30d' | '90d' = '30d'): Promise<DashboardOverview> => {
      return authFetch<DashboardOverview>(`/api/admin/dashboard/overview?period=${period}`);
    },
  },

  users: {
    /**
     * Get paginated list of users with optional filters
     * @param params - Search, filter, and pagination parameters
     * @returns List of users with pagination metadata
     */
    getList: (params?: UsersListParams): Promise<UsersListResponse> => {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.role) query.append('role', params.role);
      if (params?.status) query.append('status', params.status);
      if (params?.page !== undefined) query.append('page', String(params.page));
      if (params?.limit !== undefined) query.append('limit', String(params.limit));

      const queryString = query.toString();
      const endpoint = queryString ? `/api/admin/users?${queryString}` : '/api/admin/users';

      return authFetch<UsersListResponse>(endpoint);
    },

    /**
     * Get detailed information about a specific user
     * @param userId - The ID of the user to retrieve
     * @returns User details including stats and recent activity
     */
    getDetails: (userId: string): Promise<UserDetails> => {
      return authFetch<UserDetails>(`/api/admin/users/${userId}`);
    },

    /**
     * Update a user's role
     * @param userId - The ID of the user to update
     * @param role - New role to assign ('admin', 'premiumuser', or 'user')
     * @returns Success response
     */
    updateRole: (userId: string, role: string): Promise<UpdateRoleResponse> => {
      return authFetch<UpdateRoleResponse>(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
    },

    /**
     * Block or unblock a user
     * @param userId - The ID of the user to block/unblock
     * @param blocked - True to block, false to unblock
     * @param reason - Optional reason for blocking (required when blocking)
     * @returns Success response
     */
    block: (userId: string, blocked: boolean, reason?: string): Promise<BlockUserResponse> => {
      return authFetch<BlockUserResponse>(`/api/admin/users/${userId}/block`, {
        method: 'PATCH',
        body: JSON.stringify({ blocked, reason }),
      });
    },
  },
};
