import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';
import {
  rateLimitExceededResponse,
  addRateLimitHeaders,
  type RateLimitResult,
} from '@/lib/rate-limit';

describe('rateLimitExceededResponse', () => {
  const createMockResult = (overrides: Partial<RateLimitResult> = {}): RateLimitResult => ({
    success: false,
    limit: 10,
    remaining: 0,
    reset: Date.now() + 60000, // 60 seconds from now
    ...overrides,
  });

  it('should return NextResponse with status 429', async () => {
    const result = createMockResult();
    const response = rateLimitExceededResponse(result);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(429);
  });

  it('should set X-RateLimit-Limit header', () => {
    const result = createMockResult({ limit: 100 });
    const response = rateLimitExceededResponse(result);

    expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
  });

  it('should set X-RateLimit-Remaining header', () => {
    const result = createMockResult({ remaining: 5 });
    const response = rateLimitExceededResponse(result);

    expect(response.headers.get('X-RateLimit-Remaining')).toBe('5');
  });

  it('should set X-RateLimit-Reset header', () => {
    const resetTime = 1700000000000;
    const result = createMockResult({ reset: resetTime });
    const response = rateLimitExceededResponse(result);

    expect(response.headers.get('X-RateLimit-Reset')).toBe(resetTime.toString());
  });

  it('should set Retry-After header with seconds until reset', () => {
    const now = Date.now();
    const resetTime = now + 30000; // 30 seconds from now
    const result = createMockResult({ reset: resetTime });
    const response = rateLimitExceededResponse(result);

    const retryAfter = parseInt(response.headers.get('Retry-After') || '0', 10);
    // Allow for small timing differences (within 2 seconds)
    expect(retryAfter).toBeGreaterThanOrEqual(28);
    expect(retryAfter).toBeLessThanOrEqual(31);
  });

  it('should include error message in body', async () => {
    const result = createMockResult();
    const response = rateLimitExceededResponse(result);
    const body = await response.json();

    expect(body.error).toBe('Too many requests. Please try again later.');
  });

  it('should include retryAfter in body', async () => {
    const now = Date.now();
    const resetTime = now + 45000; // 45 seconds from now
    const result = createMockResult({ reset: resetTime });
    const response = rateLimitExceededResponse(result);
    const body = await response.json();

    // Allow for small timing differences
    expect(body.retryAfter).toBeGreaterThanOrEqual(43);
    expect(body.retryAfter).toBeLessThanOrEqual(46);
  });
});

describe('addRateLimitHeaders', () => {
  const createMockResult = (overrides: Partial<RateLimitResult> = {}): RateLimitResult => ({
    success: true,
    limit: 50,
    remaining: 25,
    reset: 1700000000000,
    ...overrides,
  });

  it('should add X-RateLimit-Limit header to response', () => {
    const response = NextResponse.json({ data: 'test' });
    const result = createMockResult({ limit: 100 });

    addRateLimitHeaders(response, result);

    expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
  });

  it('should add X-RateLimit-Remaining header to response', () => {
    const response = NextResponse.json({ data: 'test' });
    const result = createMockResult({ remaining: 42 });

    addRateLimitHeaders(response, result);

    expect(response.headers.get('X-RateLimit-Remaining')).toBe('42');
  });

  it('should add X-RateLimit-Reset header to response', () => {
    const resetTime = 1700000000000;
    const response = NextResponse.json({ data: 'test' });
    const result = createMockResult({ reset: resetTime });

    addRateLimitHeaders(response, result);

    expect(response.headers.get('X-RateLimit-Reset')).toBe(resetTime.toString());
  });

  it('should return the same response object', () => {
    const response = NextResponse.json({ data: 'test' });
    const result = createMockResult();

    const returnedResponse = addRateLimitHeaders(response, result);

    expect(returnedResponse).toBe(response);
  });

  it('should preserve existing response properties', async () => {
    const response = NextResponse.json({ message: 'success' }, { status: 200 });
    response.headers.set('X-Custom-Header', 'custom-value');
    const result = createMockResult();

    addRateLimitHeaders(response, result);

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Custom-Header')).toBe('custom-value');
    const body = await response.json();
    expect(body.message).toBe('success');
  });

  it('should handle zero remaining requests', () => {
    const response = NextResponse.json({ data: 'test' });
    const result = createMockResult({ remaining: 0 });

    addRateLimitHeaders(response, result);

    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
  });
});
