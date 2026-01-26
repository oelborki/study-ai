import { describe, it, expect } from 'vitest';
import { securityHeaders, type SecurityHeader } from '@/lib/security/headers';

describe('securityHeaders', () => {
  it('should be an array of objects with key and value properties', () => {
    expect(Array.isArray(securityHeaders)).toBe(true);

    for (const header of securityHeaders) {
      expect(header).toHaveProperty('key');
      expect(header).toHaveProperty('value');
      expect(typeof header.key).toBe('string');
      expect(typeof header.value).toBe('string');
    }
  });

  it('should contain exactly 7 headers', () => {
    expect(securityHeaders).toHaveLength(7);
  });

  describe('X-Frame-Options', () => {
    it('should be set to DENY', () => {
      const header = securityHeaders.find((h) => h.key === 'X-Frame-Options');
      expect(header).toBeDefined();
      expect(header?.value).toBe('DENY');
    });
  });

  describe('X-Content-Type-Options', () => {
    it('should be set to nosniff', () => {
      const header = securityHeaders.find((h) => h.key === 'X-Content-Type-Options');
      expect(header).toBeDefined();
      expect(header?.value).toBe('nosniff');
    });
  });

  describe('Referrer-Policy', () => {
    it('should be defined with a valid value', () => {
      const header = securityHeaders.find((h) => h.key === 'Referrer-Policy');
      expect(header).toBeDefined();
      expect(header?.value).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('Permissions-Policy', () => {
    it('should be defined', () => {
      const header = securityHeaders.find((h) => h.key === 'Permissions-Policy');
      expect(header).toBeDefined();
    });

    it('should disable camera, microphone, and geolocation', () => {
      const header = securityHeaders.find((h) => h.key === 'Permissions-Policy');
      expect(header?.value).toContain('camera=()');
      expect(header?.value).toContain('microphone=()');
      expect(header?.value).toContain('geolocation=()');
    });
  });

  describe('Strict-Transport-Security', () => {
    it('should be defined with HSTS settings', () => {
      const header = securityHeaders.find((h) => h.key === 'Strict-Transport-Security');
      expect(header).toBeDefined();
      expect(header?.value).toContain('max-age=');
      expect(header?.value).toContain('includeSubDomains');
    });
  });

  describe('Content-Security-Policy', () => {
    it('should be defined', () => {
      const header = securityHeaders.find((h) => h.key === 'Content-Security-Policy');
      expect(header).toBeDefined();
    });

    it('should include default-src directive', () => {
      const header = securityHeaders.find((h) => h.key === 'Content-Security-Policy');
      expect(header?.value).toContain("default-src 'self'");
    });

    it('should include script-src directive', () => {
      const header = securityHeaders.find((h) => h.key === 'Content-Security-Policy');
      expect(header?.value).toContain('script-src');
    });

    it('should include frame-ancestors none for clickjacking protection', () => {
      const header = securityHeaders.find((h) => h.key === 'Content-Security-Policy');
      expect(header?.value).toContain("frame-ancestors 'none'");
    });
  });

  describe('X-XSS-Protection', () => {
    it('should be set to enable XSS filtering with block mode', () => {
      const header = securityHeaders.find((h) => h.key === 'X-XSS-Protection');
      expect(header).toBeDefined();
      expect(header?.value).toBe('1; mode=block');
    });
  });

  describe('all headers', () => {
    it('should have non-empty values', () => {
      for (const header of securityHeaders) {
        expect(header.value.length).toBeGreaterThan(0);
      }
    });

    it('should have non-empty keys', () => {
      for (const header of securityHeaders) {
        expect(header.key.length).toBeGreaterThan(0);
      }
    });

    it('should have unique keys', () => {
      const keys = securityHeaders.map((h) => h.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });
  });
});
