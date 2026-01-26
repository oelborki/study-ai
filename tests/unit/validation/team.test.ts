import { describe, it, expect } from 'vitest';
import {
  createTeamSchema,
  updateTeamSchema,
  inviteTeamMemberSchema,
} from '@/lib/validation/schemas/team';

describe('createTeamSchema', () => {
  const validInput = {
    name: 'My Team',
  };

  it('should accept valid team creation input', () => {
    const result = createTeamSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should accept input with optional description', () => {
    const result = createTeamSchema.safeParse({
      ...validInput,
      description: 'A team for studying together',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('A team for studying together');
    }
  });

  describe('name validation', () => {
    it('should reject name shorter than 2 characters', () => {
      const result = createTeamSchema.safeParse({ name: 'A' });
      expect(result.success).toBe(false);
    });

    it('should accept name with exactly 2 characters', () => {
      const result = createTeamSchema.safeParse({ name: 'AB' });
      expect(result.success).toBe(true);
    });

    it('should accept name with exactly 100 characters', () => {
      const result = createTeamSchema.safeParse({ name: 'a'.repeat(100) });
      expect(result.success).toBe(true);
    });

    it('should reject name longer than 100 characters', () => {
      const result = createTeamSchema.safeParse({ name: 'a'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('should trim whitespace from name', () => {
      const result = createTeamSchema.safeParse({ name: '  Team Name  ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Team Name');
      }
    });
  });

  describe('description validation', () => {
    it('should accept description with exactly 500 characters', () => {
      const result = createTeamSchema.safeParse({
        ...validInput,
        description: 'a'.repeat(500),
      });
      expect(result.success).toBe(true);
    });

    it('should reject description longer than 500 characters', () => {
      const result = createTeamSchema.safeParse({
        ...validInput,
        description: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it('should allow empty description', () => {
      const result = createTeamSchema.safeParse({
        ...validInput,
        description: '',
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('updateTeamSchema', () => {
  it('should accept empty object (all fields optional)', () => {
    const result = updateTeamSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept valid name update', () => {
    const result = updateTeamSchema.safeParse({ name: 'New Team Name' });
    expect(result.success).toBe(true);
  });

  it('should accept valid description update', () => {
    const result = updateTeamSchema.safeParse({ description: 'New description' });
    expect(result.success).toBe(true);
  });

  it('should accept both name and description', () => {
    const result = updateTeamSchema.safeParse({
      name: 'Updated Name',
      description: 'Updated description',
    });
    expect(result.success).toBe(true);
  });

  it('should reject name shorter than 2 characters', () => {
    const result = updateTeamSchema.safeParse({ name: 'A' });
    expect(result.success).toBe(false);
  });

  it('should reject name longer than 100 characters', () => {
    const result = updateTeamSchema.safeParse({ name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('should reject description longer than 500 characters', () => {
    const result = updateTeamSchema.safeParse({ description: 'a'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('should trim whitespace from name', () => {
    const result = updateTeamSchema.safeParse({ name: '  Trimmed Name  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Trimmed Name');
    }
  });
});

describe('inviteTeamMemberSchema', () => {
  const validInput = {
    email: 'teammate@example.com',
  };

  it('should accept valid invite input with default role', () => {
    const result = inviteTeamMemberSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('member');
    }
  });

  it('should accept valid invite input with explicit member role', () => {
    const result = inviteTeamMemberSchema.safeParse({
      ...validInput,
      role: 'member',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('member');
    }
  });

  it('should accept valid invite input with admin role', () => {
    const result = inviteTeamMemberSchema.safeParse({
      ...validInput,
      role: 'admin',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('admin');
    }
  });

  describe('email validation', () => {
    it('should reject invalid email format', () => {
      const result = inviteTeamMemberSchema.safeParse({ email: 'notanemail' });
      expect(result.success).toBe(false);
    });

    it('should normalize email to lowercase', () => {
      const result = inviteTeamMemberSchema.safeParse({
        email: 'TeamMate@Example.COM',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('teammate@example.com');
      }
    });
  });

  describe('role validation', () => {
    it('should reject invalid role value', () => {
      const result = inviteTeamMemberSchema.safeParse({
        ...validInput,
        role: 'superadmin',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty role string', () => {
      const result = inviteTeamMemberSchema.safeParse({
        ...validInput,
        role: '',
      });
      expect(result.success).toBe(false);
    });
  });
});
