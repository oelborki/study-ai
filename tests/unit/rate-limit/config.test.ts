import { describe, it, expect } from 'vitest';
import {
  RATE_LIMIT_CONFIGS,
  type RateLimitType,
  type RateLimitConfig,
} from '@/lib/rate-limit/config';

describe('RATE_LIMIT_CONFIGS', () => {
  describe('structure', () => {
    it('should contain all rate limit types', () => {
      const expectedTypes: RateLimitType[] = ['auth', 'generate', 'upload', 'general'];

      for (const type of expectedTypes) {
        expect(RATE_LIMIT_CONFIGS[type]).toBeDefined();
      }
    });

    it('should only contain expected rate limit types', () => {
      const configKeys = Object.keys(RATE_LIMIT_CONFIGS);
      const expectedTypes: RateLimitType[] = ['auth', 'generate', 'upload', 'general'];

      expect(configKeys).toHaveLength(expectedTypes.length);
      for (const key of configKeys) {
        expect(expectedTypes).toContain(key);
      }
    });

    it('should have valid config structure for each type', () => {
      for (const [type, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
        expect(config).toHaveProperty('requests');
        expect(config).toHaveProperty('windowSeconds');
        expect(typeof config.requests).toBe('number');
        expect(typeof config.windowSeconds).toBe('number');
      }
    });
  });

  describe('config values', () => {
    it('should have positive requests values', () => {
      for (const [type, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
        expect(config.requests).toBeGreaterThan(0);
      }
    });

    it('should have positive windowSeconds values', () => {
      for (const [type, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
        expect(config.windowSeconds).toBeGreaterThan(0);
      }
    });

    it('should have integer requests values', () => {
      for (const [type, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
        expect(Number.isInteger(config.requests)).toBe(true);
      }
    });

    it('should have integer windowSeconds values', () => {
      for (const [type, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
        expect(Number.isInteger(config.windowSeconds)).toBe(true);
      }
    });
  });

  describe('specific rate limits', () => {
    it('auth: should allow 5 requests per 60 seconds', () => {
      expect(RATE_LIMIT_CONFIGS.auth.requests).toBe(5);
      expect(RATE_LIMIT_CONFIGS.auth.windowSeconds).toBe(60);
    });

    it('generate: should allow 10 requests per 60 seconds', () => {
      expect(RATE_LIMIT_CONFIGS.generate.requests).toBe(10);
      expect(RATE_LIMIT_CONFIGS.generate.windowSeconds).toBe(60);
    });

    it('upload: should allow 5 requests per 60 seconds', () => {
      expect(RATE_LIMIT_CONFIGS.upload.requests).toBe(5);
      expect(RATE_LIMIT_CONFIGS.upload.windowSeconds).toBe(60);
    });

    it('general: should allow 100 requests per 60 seconds', () => {
      expect(RATE_LIMIT_CONFIGS.general.requests).toBe(100);
      expect(RATE_LIMIT_CONFIGS.general.windowSeconds).toBe(60);
    });
  });

  describe('type safety', () => {
    it('should satisfy RateLimitConfig interface for each entry', () => {
      const validateConfig = (config: RateLimitConfig): boolean => {
        return (
          typeof config.requests === 'number' &&
          typeof config.windowSeconds === 'number' &&
          config.requests > 0 &&
          config.windowSeconds > 0
        );
      };

      for (const config of Object.values(RATE_LIMIT_CONFIGS)) {
        expect(validateConfig(config)).toBe(true);
      }
    });
  });
});
