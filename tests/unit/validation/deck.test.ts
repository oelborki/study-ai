import { describe, it, expect } from 'vitest';
import {
  createDeckSchema,
  generateSchema,
  updateDeckSchema,
} from '@/lib/validation/schemas/deck';

describe('createDeckSchema', () => {
  const validInput = {
    title: 'My Study Deck',
    fileId: 'file-123',
  };

  it('should accept valid deck creation input', () => {
    const result = createDeckSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should accept input with optional teamId', () => {
    const result = createDeckSchema.safeParse({ ...validInput, teamId: 'team-456' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.teamId).toBe('team-456');
    }
  });

  it('should reject empty title', () => {
    const result = createDeckSchema.safeParse({ ...validInput, title: '' });
    expect(result.success).toBe(false);
  });

  it('should reject title longer than 200 characters', () => {
    const result = createDeckSchema.safeParse({ ...validInput, title: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('should trim whitespace from title', () => {
    const result = createDeckSchema.safeParse({ ...validInput, title: '  My Deck  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('My Deck');
    }
  });

  it('should reject empty fileId', () => {
    const result = createDeckSchema.safeParse({ ...validInput, fileId: '' });
    expect(result.success).toBe(false);
  });

  it('should require title and fileId', () => {
    const result = createDeckSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('generateSchema', () => {
  const validInput = {
    fileId: 'file-123',
  };

  it('should accept minimal valid input (fileId only)', () => {
    const result = generateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should accept input with config options', () => {
    const result = generateSchema.safeParse({
      ...validInput,
      config: {
        numCards: 20,
        focusTopics: ['math', 'science'],
        difficulty: 'medium',
      },
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty fileId', () => {
    const result = generateSchema.safeParse({ fileId: '' });
    expect(result.success).toBe(false);
  });

  describe('numCards validation', () => {
    it('should reject numCards less than 1', () => {
      const result = generateSchema.safeParse({
        ...validInput,
        config: { numCards: 0 },
      });
      expect(result.success).toBe(false);
    });

    it('should accept numCards equal to 1', () => {
      const result = generateSchema.safeParse({
        ...validInput,
        config: { numCards: 1 },
      });
      expect(result.success).toBe(true);
    });

    it('should accept numCards equal to 100', () => {
      const result = generateSchema.safeParse({
        ...validInput,
        config: { numCards: 100 },
      });
      expect(result.success).toBe(true);
    });

    it('should reject numCards greater than 100', () => {
      const result = generateSchema.safeParse({
        ...validInput,
        config: { numCards: 101 },
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer numCards', () => {
      const result = generateSchema.safeParse({
        ...validInput,
        config: { numCards: 10.5 },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('difficulty validation', () => {
    it('should accept valid difficulty values', () => {
      const difficulties = ['easy', 'medium', 'hard'] as const;
      for (const difficulty of difficulties) {
        const result = generateSchema.safeParse({
          ...validInput,
          config: { difficulty },
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid difficulty value', () => {
      const result = generateSchema.safeParse({
        ...validInput,
        config: { difficulty: 'impossible' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('focusTopics validation', () => {
    it('should accept array of strings for focusTopics', () => {
      const result = generateSchema.safeParse({
        ...validInput,
        config: { focusTopics: ['topic1', 'topic2'] },
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty array for focusTopics', () => {
      const result = generateSchema.safeParse({
        ...validInput,
        config: { focusTopics: [] },
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('updateDeckSchema', () => {
  it('should accept empty object (all fields optional)', () => {
    const result = updateDeckSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept valid title update', () => {
    const result = updateDeckSchema.safeParse({ title: 'New Title' });
    expect(result.success).toBe(true);
  });

  it('should accept valid isPublic update', () => {
    const result = updateDeckSchema.safeParse({ isPublic: true });
    expect(result.success).toBe(true);
  });

  it('should accept both title and isPublic', () => {
    const result = updateDeckSchema.safeParse({
      title: 'Updated Title',
      isPublic: false,
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty title', () => {
    const result = updateDeckSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('should reject title longer than 200 characters', () => {
    const result = updateDeckSchema.safeParse({ title: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('should trim whitespace from title', () => {
    const result = updateDeckSchema.safeParse({ title: '  Trimmed Title  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Trimmed Title');
    }
  });
});
