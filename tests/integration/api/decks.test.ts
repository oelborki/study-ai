import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextResponse } from 'next/server';

// Mock shared functions
const mockAuth = vi.fn();
const mockDecksFindFirst = vi.fn();
const mockDecksFindMany = vi.fn();
const mockTeamMembersFindMany = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockLogError = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockGetStorage = vi.fn();

// Mock auth
vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      decks: { findFirst: mockDecksFindFirst, findMany: mockDecksFindMany },
      teamMembers: { findMany: mockTeamMembersFindMany },
    },
    insert: mockInsert,
    delete: mockDelete,
  },
  schema: {
    decks: { id: 'id', userId: 'userId', teamId: 'teamId' },
    teamMembers: { userId: 'userId' },
  },
}));

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  logError: mockLogError,
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mockCheckRateLimit,
  rateLimitExceededResponse: () =>
    NextResponse.json({ error: 'Too many requests' }, { status: 429 }),
}));

vi.mock('@/lib/storage', () => ({
  getStorage: mockGetStorage,
  getAllDeckKeys: vi.fn(() => ['key1', 'key2']),
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
  and: vi.fn((...conditions) => ({ and: conditions })),
  or: vi.fn((...conditions) => ({ or: conditions })),
  inArray: vi.fn((a, b) => ({ inArray: { field: a, values: b } })),
}));

describe('GET /api/decks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockTeamMembersFindMany.mockResolvedValue([]);
    mockDecksFindMany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return 401 without auth', async () => {
    mockAuth.mockResolvedValue(null);

    const { GET } = await import('@/app/api/decks/route');
    const response = await GET();

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 401 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const { GET } = await import('@/app/api/decks/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('should return user decks when authenticated', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockDecksFindMany.mockResolvedValue([
      { id: 'deck-1', title: 'Test Deck 1', userId: 'user-123' },
      { id: 'deck-2', title: 'Test Deck 2', userId: 'user-123' },
    ]);

    const { GET } = await import('@/app/api/decks/route');
    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.decks).toHaveLength(2);
    expect(data.decks[0].title).toBe('Test Deck 1');
  });

  it('should return empty array when user has no decks', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockDecksFindMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/decks/route');
    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.decks).toHaveLength(0);
  });

  it('should include team decks when user is in teams', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockTeamMembersFindMany.mockResolvedValue([{ teamId: 'team-1' }]);
    mockDecksFindMany.mockResolvedValue([
      { id: 'deck-1', title: 'Personal Deck', userId: 'user-123' },
      { id: 'deck-2', title: 'Team Deck', teamId: 'team-1' },
    ]);

    const { GET } = await import('@/app/api/decks/route');
    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.decks).toHaveLength(2);
  });

  it('should return 500 on database error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockTeamMembersFindMany.mockRejectedValue(new Error('Database error'));

    const { GET } = await import('@/app/api/decks/route');
    const response = await GET();

    expect(response.status).toBe(500);
    expect(mockLogError).toHaveBeenCalled();
  });
});

describe('POST /api/decks/create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockCheckRateLimit.mockResolvedValue({ success: true });
    mockInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return 429 when rate limit exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({ success: false, remaining: 0 });
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const { POST } = await import('@/app/api/decks/create/route');
    const request = new Request('http://localhost/api/decks/create', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Deck' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(429);
  });

  it('should return 401 without auth', async () => {
    mockAuth.mockResolvedValue(null);

    const { POST } = await import('@/app/api/decks/create/route');
    const request = new Request('http://localhost/api/decks/create', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Deck' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should return 400 for empty title', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const { POST } = await import('@/app/api/decks/create/route');
    const request = new Request('http://localhost/api/decks/create', {
      method: 'POST',
      body: JSON.stringify({ title: '' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 400 for title exceeding max length', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const { POST } = await import('@/app/api/decks/create/route');
    const request = new Request('http://localhost/api/decks/create', {
      method: 'POST',
      body: JSON.stringify({ title: 'a'.repeat(201) }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid JSON body', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const { POST } = await import('@/app/api/decks/create/route');
    const request = new Request('http://localhost/api/decks/create', {
      method: 'POST',
      body: 'not json',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should create deck and return id on success', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const { POST } = await import('@/app/api/decks/create/route');
    const request = new Request('http://localhost/api/decks/create', {
      method: 'POST',
      body: JSON.stringify({ title: 'My New Deck' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.id).toBeDefined();
  });

  it('should set fileType to manual for created decks', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    const mockValues = vi.fn().mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockValues });

    const { POST } = await import('@/app/api/decks/create/route');
    const request = new Request('http://localhost/api/decks/create', {
      method: 'POST',
      body: JSON.stringify({ title: 'Manual Deck' }),
    });

    await POST(request);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        fileType: 'manual',
        userId: 'user-123',
      })
    );
  });
});

describe('DELETE /api/decks/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockGetStorage.mockReturnValue({
      deleteMany: vi.fn().mockResolvedValue(undefined),
    });
    mockDelete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return 401 without auth', async () => {
    mockAuth.mockResolvedValue(null);

    const { DELETE } = await import('@/app/api/decks/[id]/route');
    const request = new Request('http://localhost/api/decks/deck-1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: 'deck-1' }) });
    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent deck', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockDecksFindFirst.mockResolvedValue(null);

    const { DELETE } = await import('@/app/api/decks/[id]/route');
    const request = new Request('http://localhost/api/decks/deck-1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: 'deck-1' }) });
    expect(response.status).toBe(404);
  });

  it('should return 404 when deck belongs to another user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    // With the AND condition (deck.id AND deck.userId), null is returned
    mockDecksFindFirst.mockResolvedValue(null);

    const { DELETE } = await import('@/app/api/decks/[id]/route');
    const request = new Request('http://localhost/api/decks/deck-1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: 'deck-1' }) });
    expect(response.status).toBe(404);
  });

  it('should delete deck and return success', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockDecksFindFirst.mockResolvedValue({
      id: 'deck-1',
      userId: 'user-123',
      fileType: 'pdf',
    });

    const { DELETE } = await import('@/app/api/decks/[id]/route');
    const request = new Request('http://localhost/api/decks/deck-1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: 'deck-1' }) });
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should delete associated files from storage', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockDecksFindFirst.mockResolvedValue({
      id: 'deck-1',
      userId: 'user-123',
      fileType: 'pdf',
    });
    const mockDeleteMany = vi.fn().mockResolvedValue(undefined);
    mockGetStorage.mockReturnValue({ deleteMany: mockDeleteMany });

    const { DELETE } = await import('@/app/api/decks/[id]/route');
    const request = new Request('http://localhost/api/decks/deck-1', {
      method: 'DELETE',
    });

    await DELETE(request, { params: Promise.resolve({ id: 'deck-1' }) });

    expect(mockDeleteMany).toHaveBeenCalled();
  });

  it('should return 500 on database error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockDecksFindFirst.mockRejectedValue(new Error('Database error'));

    const { DELETE } = await import('@/app/api/decks/[id]/route');
    const request = new Request('http://localhost/api/decks/deck-1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: 'deck-1' }) });
    expect(response.status).toBe(500);
    expect(mockLogError).toHaveBeenCalled();
  });
});
