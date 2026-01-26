import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { validationErrorResponse, parseAndValidate } from '@/lib/validation/middleware';

// Test schema for parseAndValidate tests
const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().min(0, 'Age must be positive'),
});

// Helper to create mock Request object
const mockRequest = (body: unknown, shouldThrow = false) => {
  return {
    json: shouldThrow
      ? vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      : vi.fn().mockResolvedValue(body),
  } as unknown as Request;
};

describe('validationErrorResponse', () => {
  it('should return NextResponse with status 400', () => {
    const response = validationErrorResponse('Test error');

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(400);
  });

  it('should include error message in body', async () => {
    const response = validationErrorResponse('Validation failed');
    const body = await response.json();

    expect(body.error).toBe('Validation failed');
  });

  it('should include formatted details when provided', async () => {
    const details: z.ZodIssue[] = [
      {
        code: 'too_small',
        minimum: 1,
        type: 'string',
        inclusive: true,
        exact: false,
        message: 'Name is required',
        path: ['name'],
      },
    ];

    const response = validationErrorResponse('Validation failed', details);
    const body = await response.json();

    expect(body.details).toBeDefined();
    expect(body.details).toHaveLength(1);
    expect(body.details[0].field).toBe('name');
    expect(body.details[0].message).toBe('Name is required');
  });

  it('should join path array into field string with dots', async () => {
    const details: z.ZodIssue[] = [
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'undefined',
        message: 'Required',
        path: ['user', 'profile', 'email'],
      },
    ];

    const response = validationErrorResponse('Validation failed', details);
    const body = await response.json();

    expect(body.details[0].field).toBe('user.profile.email');
  });

  it('should handle undefined details', async () => {
    const response = validationErrorResponse('Error message');
    const body = await response.json();

    expect(body.error).toBe('Error message');
    expect(body.details).toBeUndefined();
  });

  it('should handle empty details array', async () => {
    const response = validationErrorResponse('Error message', []);
    const body = await response.json();

    expect(body.error).toBe('Error message');
    expect(body.details).toHaveLength(0);
  });

  it('should handle multiple validation errors in details', async () => {
    const details: z.ZodIssue[] = [
      {
        code: 'too_small',
        minimum: 1,
        type: 'string',
        inclusive: true,
        exact: false,
        message: 'Name is required',
        path: ['name'],
      },
      {
        code: 'too_small',
        minimum: 0,
        type: 'number',
        inclusive: true,
        exact: false,
        message: 'Age must be positive',
        path: ['age'],
      },
    ];

    const response = validationErrorResponse('Multiple errors', details);
    const body = await response.json();

    expect(body.details).toHaveLength(2);
    expect(body.details[0].field).toBe('name');
    expect(body.details[1].field).toBe('age');
  });

  it('should handle empty path array', async () => {
    const details: z.ZodIssue[] = [
      {
        code: 'invalid_type',
        expected: 'object',
        received: 'null',
        message: 'Expected object, received null',
        path: [],
      },
    ];

    const response = validationErrorResponse('Error', details);
    const body = await response.json();

    expect(body.details[0].field).toBe('');
  });
});

describe('parseAndValidate', () => {
  it('should return success with valid JSON matching schema', async () => {
    const request = mockRequest({ name: 'John', age: 25 });
    const result = await parseAndValidate(request, testSchema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: 'John', age: 25 });
    }
  });

  it('should return error for invalid JSON', async () => {
    const request = mockRequest(null, true); // Request.json() throws
    const result = await parseAndValidate(request, testSchema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid JSON in request body');
      expect(result.details).toEqual([]);
    }
  });

  it('should return validation error for data not matching schema', async () => {
    const request = mockRequest({ name: '', age: 25 });
    const result = await parseAndValidate(request, testSchema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Name is required');
      expect(result.details.length).toBeGreaterThan(0);
    }
  });

  it('should return validation error for wrong data types', async () => {
    const request = mockRequest({ name: 'John', age: 'not-a-number' });
    const result = await parseAndValidate(request, testSchema);

    expect(result.success).toBe(false);
  });

  it('should return validation error for missing required fields', async () => {
    const request = mockRequest({});
    const result = await parseAndValidate(request, testSchema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.details.length).toBeGreaterThan(0);
    }
  });

  it('should call request.json() to parse body', async () => {
    const jsonMock = vi.fn().mockResolvedValue({ name: 'Test', age: 30 });
    const request = { json: jsonMock } as unknown as Request;

    await parseAndValidate(request, testSchema);

    expect(jsonMock).toHaveBeenCalledTimes(1);
  });
});
