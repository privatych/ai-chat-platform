/**
 * Test setup file
 * Runs before all tests
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Mock environment variables for tests
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_characters_long_for_security';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.OPENROUTER_API_KEY = 'test_openrouter_key';
  process.env.REDIS_URL = 'redis://localhost:6379';
});

// Cleanup after all tests
afterAll(() => {
  // Cleanup code if needed
});

// Reset mocks before each test
beforeEach(() => {
  // Reset any mocks or state
});

// Cleanup after each test
afterEach(() => {
  // Cleanup code if needed
});
