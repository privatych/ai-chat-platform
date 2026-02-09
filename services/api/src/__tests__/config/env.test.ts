import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateEnv, getEnv } from '../../config/env';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateEnv', () => {
    it('should pass with all required variables set correctly', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db';
      process.env.OPENROUTER_API_KEY = 'test_key';

      expect(() => validateEnv()).not.toThrow();
    });

    it('should fail if JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db';
      process.env.OPENROUTER_API_KEY = 'test_key';

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      validateEnv();

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalled();

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should fail if JWT_SECRET is too short', () => {
      process.env.JWT_SECRET = 'short';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db';
      process.env.OPENROUTER_API_KEY = 'test_key';

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      validateEnv();

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalled();

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should fail if DATABASE_URL is not a PostgreSQL URL', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.DATABASE_URL = 'mysql://user:pass@localhost/db';
      process.env.OPENROUTER_API_KEY = 'test_key';

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      validateEnv();

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalled();

      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should set default values for optional variables', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db';
      process.env.OPENROUTER_API_KEY = 'test_key';
      delete process.env.PORT;
      delete process.env.NODE_ENV;

      validateEnv();

      expect(process.env.PORT).toBe('3001');
      expect(process.env.NODE_ENV).toBe('development');
    });

    it('should warn if REDIS_URL is not set', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db';
      process.env.OPENROUTER_API_KEY = 'test_key';
      delete process.env.REDIS_URL;

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      validateEnv();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('REDIS_URL')
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('getEnv', () => {
    it('should return environment variable value', () => {
      process.env.TEST_VAR = 'test_value';

      const value = getEnv('TEST_VAR');

      expect(value).toBe('test_value');
    });

    it('should throw error if variable is not set', () => {
      delete process.env.TEST_VAR;

      expect(() => getEnv('TEST_VAR')).toThrow(
        'Environment variable TEST_VAR is not set'
      );
    });
  });
});
