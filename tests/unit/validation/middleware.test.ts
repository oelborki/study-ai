import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateRequest } from '@/lib/validation/middleware';

// Simple test schema
const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().min(0, 'Age must be positive'),
  email: z.string().email('Invalid email').optional(),
});

describe('validateRequest', () => {
  describe('valid data', () => {
    it('should return success true with parsed data for valid input', () => {
      const result = validateRequest(testSchema, { name: 'John', age: 25 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: 'John', age: 25 });
      }
    });

    it('should return success true with all optional fields', () => {
      const result = validateRequest(testSchema, {
        name: 'John',
        age: 25,
        email: 'john@example.com',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('john@example.com');
      }
    });

    it('should perform transformations defined in schema', () => {
      const transformSchema = z.object({
        email: z.string().email().toLowerCase(),
      });

      const result = validateRequest(transformSchema, { email: 'Test@Example.COM' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });
  });

  describe('invalid data', () => {
    it('should return success false with error for invalid input', () => {
      const result = validateRequest(testSchema, { name: '', age: 25 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Name is required');
        expect(result.details).toBeDefined();
        expect(result.details.length).toBeGreaterThan(0);
      }
    });

    it('should return first error message when multiple fields are invalid', () => {
      const result = validateRequest(testSchema, { name: '', age: -1 });

      expect(result.success).toBe(false);
      if (!result.success) {
        // Should return the first error message
        expect(typeof result.error).toBe('string');
        expect(result.error.length).toBeGreaterThan(0);
      }
    });

    it('should include all validation issues in details', () => {
      const result = validateRequest(testSchema, { name: '', age: -1 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.details.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should handle missing required fields', () => {
      const result = validateRequest(testSchema, {});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.details.length).toBeGreaterThan(0);
      }
    });

    it('should handle wrong data types', () => {
      const result = validateRequest(testSchema, { name: 'John', age: 'twenty-five' });

      expect(result.success).toBe(false);
    });

    it('should handle null input', () => {
      const result = validateRequest(testSchema, null);

      expect(result.success).toBe(false);
    });

    it('should handle undefined input', () => {
      const result = validateRequest(testSchema, undefined);

      expect(result.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should work with nested schemas', () => {
      const nestedSchema = z.object({
        user: z.object({
          name: z.string(),
          profile: z.object({
            bio: z.string().optional(),
          }),
        }),
      });

      const validResult = validateRequest(nestedSchema, {
        user: { name: 'John', profile: {} },
      });
      expect(validResult.success).toBe(true);

      const invalidResult = validateRequest(nestedSchema, {
        user: { profile: {} },
      });
      expect(invalidResult.success).toBe(false);
    });

    it('should work with array schemas', () => {
      const arraySchema = z.object({
        tags: z.array(z.string()).min(1),
      });

      const validResult = validateRequest(arraySchema, { tags: ['tag1', 'tag2'] });
      expect(validResult.success).toBe(true);

      const invalidResult = validateRequest(arraySchema, { tags: [] });
      expect(invalidResult.success).toBe(false);
    });

    it('should work with union schemas', () => {
      const unionSchema = z.object({
        value: z.union([z.string(), z.number()]),
      });

      const stringResult = validateRequest(unionSchema, { value: 'hello' });
      expect(stringResult.success).toBe(true);

      const numberResult = validateRequest(unionSchema, { value: 42 });
      expect(numberResult.success).toBe(true);

      const invalidResult = validateRequest(unionSchema, { value: true });
      expect(invalidResult.success).toBe(false);
    });

    it('should work with enum schemas', () => {
      const enumSchema = z.object({
        status: z.enum(['pending', 'active', 'completed']),
      });

      const validResult = validateRequest(enumSchema, { status: 'active' });
      expect(validResult.success).toBe(true);

      const invalidResult = validateRequest(enumSchema, { status: 'unknown' });
      expect(invalidResult.success).toBe(false);
    });
  });
});
