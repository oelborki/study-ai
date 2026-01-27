import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextResponse } from 'next/server';

// Mock shared functions
const mockUsersFindFirst = vi.fn();
const mockTokensFindFirst = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockUpdate = vi.fn();
const mockLogError = vi.fn();
const mockSendPasswordResetEmail = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockHash = vi.fn();

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: { findFirst: mockUsersFindFirst },
      passwordResetTokens: { findFirst: mockTokensFindFirst },
    },
    insert: mockInsert,
    delete: mockDelete,
    update: mockUpdate,
  },
  schema: {
    users: { id: 'id', email: 'email' },
    passwordResetTokens: { id: 'id', userId: 'userId', token: 'token', expiresAt: 'expiresAt' },
  },
}));

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  logError: mockLogError,
}));

vi.mock('@/lib/email', () => ({
  sendPasswordResetEmail: mockSendPasswordResetEmail,
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
  and: vi.fn((...conditions) => ({ and: conditions })),
  gt: vi.fn((a, b) => ({ gt: { field: a, value: b } })),
}));

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockCheckRateLimit.mockResolvedValue({ success: true });
    mockDelete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    mockInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
    mockSendPasswordResetEmail.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return 429 when rate limit exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({ success: false, remaining: 0 });

    const { POST } = await import('@/app/api/auth/forgot-password/route');
    const request = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(429);
  });

  it('should return 400 for invalid email format', async () => {
    const { POST } = await import('@/app/api/auth/forgot-password/route');
    const request = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'notanemail' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 200 for non-existent email (security)', async () => {
    mockUsersFindFirst.mockResolvedValue(null);

    const { POST } = await import('@/app/api/auth/forgot-password/route');
    const request = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@example.com' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('If an account');
  });

  it('should create reset token for existing user', async () => {
    mockUsersFindFirst.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });
    const mockValues = vi.fn().mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockValues });

    const { POST } = await import('@/app/api/auth/forgot-password/route');
    const request = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    await POST(request);

    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
      })
    );
  });

  it('should delete existing tokens before creating new one', async () => {
    mockUsersFindFirst.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });
    const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
    mockDelete.mockReturnValue({ where: mockDeleteWhere });

    const { POST } = await import('@/app/api/auth/forgot-password/route');
    const request = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    await POST(request);

    expect(mockDelete).toHaveBeenCalled();
    expect(mockDeleteWhere).toHaveBeenCalled();
  });

  it('should send password reset email', async () => {
    mockUsersFindFirst.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });

    const { POST } = await import('@/app/api/auth/forgot-password/route');
    const request = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    await POST(request);

    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      'test@example.com',
      expect.stringContaining('reset-password')
    );
  });

  it('should return 500 on database error', async () => {
    mockUsersFindFirst.mockRejectedValue(new Error('Database error'));

    const { POST } = await import('@/app/api/auth/forgot-password/route');
    const request = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    expect(mockLogError).toHaveBeenCalled();
  });
});

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockCheckRateLimit.mockResolvedValue({ success: true });
    mockHash.mockResolvedValue('hashed-new-password');
    mockUpdate.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });
    mockDelete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return 429 when rate limit exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({ success: false, remaining: 0 });

    const { POST } = await import('@/app/api/auth/reset-password/route');
    const request = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token', password: 'NewPassword1!' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(429);
  });

  it('should return 400 for weak password', async () => {
    const { POST } = await import('@/app/api/auth/reset-password/route');
    const request = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token', password: 'weak' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid/expired token', async () => {
    mockTokensFindFirst.mockResolvedValue(null);

    const { POST } = await import('@/app/api/auth/reset-password/route');
    const request = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'invalid-token', password: 'NewPassword1!' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('Invalid or expired');
  });

  it('should return 400 for empty token', async () => {
    const { POST } = await import('@/app/api/auth/reset-password/route');
    const request = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: '', password: 'NewPassword1!' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should update password on success', async () => {
    mockTokensFindFirst.mockResolvedValue({
      id: 'token-id',
      userId: 'user-123',
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 3600000),
    });
    const mockWhere = vi.fn().mockResolvedValue(undefined);
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    mockUpdate.mockReturnValue({ set: mockSet });

    const { POST } = await import('@/app/api/auth/reset-password/route');
    const request = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token', password: 'NewPassword1!' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('reset successfully');
  });

  it('should hash new password before storing', async () => {
    mockTokensFindFirst.mockResolvedValue({
      id: 'token-id',
      userId: 'user-123',
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 3600000),
    });

    const { POST } = await import('@/app/api/auth/reset-password/route');
    const request = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token', password: 'NewPassword1!' }),
    });

    await POST(request);

    expect(mockHash).toHaveBeenCalledWith('NewPassword1!', 12);
  });

  it('should delete token after successful reset', async () => {
    mockTokensFindFirst.mockResolvedValue({
      id: 'token-id',
      userId: 'user-123',
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 3600000),
    });
    const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
    mockDelete.mockReturnValue({ where: mockDeleteWhere });

    const { POST } = await import('@/app/api/auth/reset-password/route');
    const request = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token', password: 'NewPassword1!' }),
    });

    await POST(request);

    expect(mockDelete).toHaveBeenCalled();
  });

  it('should return 500 on database error', async () => {
    mockTokensFindFirst.mockRejectedValue(new Error('Database error'));

    const { POST } = await import('@/app/api/auth/reset-password/route');
    const request = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token', password: 'NewPassword1!' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    expect(mockLogError).toHaveBeenCalled();
  });
});
