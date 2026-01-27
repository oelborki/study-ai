import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextResponse } from 'next/server';

// Mock shared functions
const mockAuth = vi.fn();
const mockTeamsFindFirst = vi.fn();
const mockTeamMembersFindFirst = vi.fn();
const mockTeamMembersFindMany = vi.fn();
const mockInsert = vi.fn();
const mockLogError = vi.fn();
const mockCheckRateLimit = vi.fn();

// Mock auth
vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      teams: { findFirst: mockTeamsFindFirst },
      teamMembers: { findFirst: mockTeamMembersFindFirst, findMany: mockTeamMembersFindMany },
    },
    insert: mockInsert,
  },
  schema: {
    teams: { id: 'id', inviteCode: 'inviteCode' },
    teamMembers: { teamId: 'teamId', userId: 'userId' },
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

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'test-code'),
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
  and: vi.fn((...conditions) => ({ and: conditions })),
}));

describe('GET /api/teams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockTeamMembersFindMany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return 401 without auth', async () => {
    mockAuth.mockResolvedValue(null);

    const { GET } = await import('@/app/api/teams/route');
    const response = await GET();

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return empty array when user has no teams', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockTeamMembersFindMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/teams/route');
    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.teams).toEqual([]);
  });

  it('should return user teams with roles', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    // New pattern: findMany returns memberships with team relation
    mockTeamMembersFindMany.mockResolvedValue([
      { teamId: 'team-1', role: 'owner', team: { id: 'team-1', name: 'Team Alpha' } },
      { teamId: 'team-2', role: 'member', team: { id: 'team-2', name: 'Team Beta' } },
    ]);

    const { GET } = await import('@/app/api/teams/route');
    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.teams).toHaveLength(2);
    expect(data.teams[0].name).toBe('Team Alpha');
    expect(data.teams[0].role).toBe('owner');
    expect(data.teams[1].name).toBe('Team Beta');
    expect(data.teams[1].role).toBe('member');
  });

  it('should filter out null teams', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    // New pattern: memberships with team relation, null team filtered out
    mockTeamMembersFindMany.mockResolvedValue([
      { teamId: 'team-1', role: 'owner', team: { id: 'team-1', name: 'Team Alpha' } },
      { teamId: 'team-2', role: 'member', team: null }, // Team was deleted
    ]);

    const { GET } = await import('@/app/api/teams/route');
    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.teams).toHaveLength(1);
  });

  it('should return 500 on database error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockTeamMembersFindMany.mockRejectedValue(new Error('Database error'));

    const { GET } = await import('@/app/api/teams/route');
    const response = await GET();

    expect(response.status).toBe(500);
    expect(mockLogError).toHaveBeenCalled();
  });
});

describe('POST /api/teams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockCheckRateLimit.mockResolvedValue({ success: true });
    const mockReturning = vi.fn().mockResolvedValue([{ id: 'new-team-id', name: 'New Team', inviteCode: 'test-code' }]);
    mockInsert.mockReturnValue({ values: vi.fn().mockReturnValue({ returning: mockReturning }) });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return 429 when rate limit exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({ success: false, remaining: 0 });
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const { POST } = await import('@/app/api/teams/route');
    const request = new Request('http://localhost/api/teams', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Team' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(429);
  });

  it('should return 401 without auth', async () => {
    mockAuth.mockResolvedValue(null);

    const { POST } = await import('@/app/api/teams/route');
    const request = new Request('http://localhost/api/teams', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Team' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should return 400 for empty team name', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const { POST } = await import('@/app/api/teams/route');
    const request = new Request('http://localhost/api/teams', {
      method: 'POST',
      body: JSON.stringify({ name: '' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 400 for team name exceeding max length', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const { POST } = await import('@/app/api/teams/route');
    const request = new Request('http://localhost/api/teams', {
      method: 'POST',
      body: JSON.stringify({ name: 'a'.repeat(101) }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should create team and return it on success', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const { POST } = await import('@/app/api/teams/route');
    const request = new Request('http://localhost/api/teams', {
      method: 'POST',
      body: JSON.stringify({ name: 'My New Team' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.team).toBeDefined();
    expect(data.team.name).toBe('New Team');
  });

  it('should add creator as owner member', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    const mockValues = vi.fn();
    mockValues.mockReturnValueOnce({
      returning: vi.fn().mockResolvedValue([{ id: 'new-team-id', name: 'New Team' }]),
    });
    mockValues.mockReturnValueOnce(Promise.resolve());
    mockInsert.mockReturnValue({ values: mockValues });

    const { POST } = await import('@/app/api/teams/route');
    const request = new Request('http://localhost/api/teams', {
      method: 'POST',
      body: JSON.stringify({ name: 'My New Team' }),
    });

    await POST(request);

    // Second insert should be for team member
    expect(mockInsert).toHaveBeenCalledTimes(2);
  });

  it('should return 500 on database error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(new Error('Database error')),
      }),
    });

    const { POST } = await import('@/app/api/teams/route');
    const request = new Request('http://localhost/api/teams', {
      method: 'POST',
      body: JSON.stringify({ name: 'My New Team' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    expect(mockLogError).toHaveBeenCalled();
  });
});

describe('POST /api/teams/join/[code]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return 401 without auth', async () => {
    mockAuth.mockResolvedValue(null);

    const { POST } = await import('@/app/api/teams/join/[code]/route');
    const request = new Request('http://localhost/api/teams/join/abc123', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ code: 'abc123' }) });
    expect(response.status).toBe(401);
  });

  it('should return 404 for invalid invite code', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockTeamsFindFirst.mockResolvedValue(null);

    const { POST } = await import('@/app/api/teams/join/[code]/route');
    const request = new Request('http://localhost/api/teams/join/invalid', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ code: 'invalid' }) });
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.error).toContain('Invalid invite code');
  });

  it('should return alreadyMember flag for existing member', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockTeamsFindFirst.mockResolvedValue({ id: 'team-1', name: 'Test Team' });
    mockTeamMembersFindFirst.mockResolvedValue({ teamId: 'team-1', userId: 'user-123' });

    const { POST } = await import('@/app/api/teams/join/[code]/route');
    const request = new Request('http://localhost/api/teams/join/valid-code', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ code: 'valid-code' }) });
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.alreadyMember).toBe(true);
    expect(data.team.name).toBe('Test Team');
  });

  it('should add user as member and return joined flag', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockTeamsFindFirst.mockResolvedValue({ id: 'team-1', name: 'Test Team' });
    mockTeamMembersFindFirst.mockResolvedValue(null);
    const mockValues = vi.fn().mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockValues });

    const { POST } = await import('@/app/api/teams/join/[code]/route');
    const request = new Request('http://localhost/api/teams/join/valid-code', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ code: 'valid-code' }) });
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.joined).toBe(true);
    expect(data.team.name).toBe('Test Team');
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: 'team-1',
        userId: 'user-123',
        role: 'member',
      })
    );
  });

  it('should return 500 on database error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockTeamsFindFirst.mockRejectedValue(new Error('Database error'));

    const { POST } = await import('@/app/api/teams/join/[code]/route');
    const request = new Request('http://localhost/api/teams/join/valid-code', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ code: 'valid-code' }) });
    expect(response.status).toBe(500);
    expect(mockLogError).toHaveBeenCalled();
  });
});

describe('GET /api/teams/join/[code]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return 404 for non-existent team', async () => {
    mockTeamsFindFirst.mockResolvedValue(null);

    const { GET } = await import('@/app/api/teams/join/[code]/route');
    const request = new Request('http://localhost/api/teams/join/invalid', {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ code: 'invalid' }) });
    expect(response.status).toBe(404);
  });

  it('should return team info with member count', async () => {
    mockTeamsFindFirst.mockResolvedValue({ id: 'team-1', name: 'Test Team' });
    mockTeamMembersFindMany.mockResolvedValue([
      { userId: 'user-1' },
      { userId: 'user-2' },
      { userId: 'user-3' },
    ]);

    const { GET } = await import('@/app/api/teams/join/[code]/route');
    const request = new Request('http://localhost/api/teams/join/valid-code', {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ code: 'valid-code' }) });
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.team.name).toBe('Test Team');
    expect(data.team.memberCount).toBe(3);
  });

  it('should return 500 on database error', async () => {
    mockTeamsFindFirst.mockRejectedValue(new Error('Database error'));

    const { GET } = await import('@/app/api/teams/join/[code]/route');
    const request = new Request('http://localhost/api/teams/join/valid-code', {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ code: 'valid-code' }) });
    expect(response.status).toBe(500);
    expect(mockLogError).toHaveBeenCalled();
  });
});
