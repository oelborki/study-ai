import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextResponse } from 'next/server';

// Mock shared functions
const mockFindFirst = vi.fn();
const mockInsert = vi.fn();
const mockReturning = vi.fn();
const mockLogError = vi.fn();
const mockSendWelcomeEmail = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockHash = vi.fn();

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: { findFirst: mockFindFirst },
    },
    insert: mockInsert,
  },
  schema: {
    users: { email: 'email' },
  },
}));

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  logError: mockLogError,
}));

vi.mock('@/lib/email', () => ({
  sendWelcomeEmail: mockSendWelcomeEmail,
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mockCheckRateLimit,
  rateLimitExceededResponse: () =>
    NextResponse.json({ error: 'Too many requests' }, { status: 429 }),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: mockHash,
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
}));

describe('POST /api/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ success: true });
    mockHash.mockResolvedValue('hashed-password-123');
    mockInsert.mockReturnValue({ values: vi.fn().mockReturnValue({ returning: mockReturning }) });
    mockReturning.mockResolvedValue([{ id: 'new-user-id' }]);
    mockSendWelcomeEmail.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return 429 when rate limit exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({ success: false, remaining: 0 });

    const { POST } = await import('@/app/api/register/route');
    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password1!',
        name: 'Test User',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(429);
  });

  it('should return 400 for invalid email format', async () => {
    const { POST } = await import('@/app/api/register/route');
    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'notanemail',
        password: 'Password1!',
        name: 'Test User',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('should return 400 for weak password', async () => {
    const { POST } = await import('@/app/api/register/route');
    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('should return 400 for password without special character', async () => {
    const { POST } = await import('@/app/api/register/route');
    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password1',
        name: 'Test User',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 400 for duplicate email', async () => {
    mockFindFirst.mockResolvedValue({ id: 'existing-user', email: 'test@example.com' });

    const { POST } = await import('@/app/api/register/route');
    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password1!',
        name: 'Test User',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('already exists');
  });

  it('should hash password before storing', async () => {
    mockFindFirst.mockResolvedValue(null);

    const { POST } = await import('@/app/api/register/route');
    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password1!',
        name: 'Test User',
      }),
    });

    await POST(request);

    expect(mockHash).toHaveBeenCalledWith('Password1!', 12);
  });

  it('should return 200 and create user on success', async () => {
    mockFindFirst.mockResolvedValue(null);

    const { POST } = await import('@/app/api/register/route');
    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password1!',
        name: 'Test User',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.userId).toBe('new-user-id');
  });

  it('should send welcome email after successful registration', async () => {
    mockFindFirst.mockResolvedValue(null);

    const { POST } = await import('@/app/api/register/route');
    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password1!',
        name: 'Test User',
      }),
    });

    await POST(request);

    // Give time for fire-and-forget email
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockSendWelcomeEmail).toHaveBeenCalledWith('test@example.com', 'Test User');
  });

  it('should return 400 when name is missing', async () => {
    mockFindFirst.mockResolvedValue(null);

    const { POST } = await import('@/app/api/register/route');
    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'john.doe@example.com',
        password: 'Password1!',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('should return 500 on database error', async () => {
    mockFindFirst.mockRejectedValue(new Error('Database connection failed'));

    const { POST } = await import('@/app/api/register/route');
    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password1!',
        name: 'Test User',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    expect(mockLogError).toHaveBeenCalled();
  });
});
