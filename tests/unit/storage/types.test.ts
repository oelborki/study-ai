import { describe, it, expect } from 'vitest';
import {
  getStorageKey,
  getAllDeckKeys,
  type ContentType,
} from '@/lib/storage/types';

describe('getStorageKey', () => {
  const testDeckId = 'deck-123';

  describe('original category', () => {
    it('should return correct path for original with pdf extension', () => {
      const result = getStorageKey(testDeckId, 'original', 'pdf');
      expect(result).toBe('decks/deck-123/original.pdf');
    });

    it('should return correct path for original with pptx extension', () => {
      const result = getStorageKey(testDeckId, 'original', 'pptx');
      expect(result).toBe('decks/deck-123/original.pptx');
    });

    it('should throw error when fileExt is not provided for original', () => {
      expect(() => getStorageKey(testDeckId, 'original')).toThrow(
        'fileExt required for original files'
      );
    });

    it('should throw error when fileExt is empty string for original', () => {
      expect(() => getStorageKey(testDeckId, 'original', '')).toThrow(
        'fileExt required for original files'
      );
    });
  });

  describe('extracted category', () => {
    it('should return correct path for extracted', () => {
      const result = getStorageKey(testDeckId, 'extracted');
      expect(result).toBe('decks/deck-123/extracted.json');
    });

    it('should ignore fileExt for extracted category', () => {
      const result = getStorageKey(testDeckId, 'extracted', 'pdf');
      expect(result).toBe('decks/deck-123/extracted.json');
    });
  });

  describe('summary category', () => {
    it('should return correct path for summary', () => {
      const result = getStorageKey(testDeckId, 'summary');
      expect(result).toBe('decks/deck-123/summary.json');
    });
  });

  describe('flashcards category', () => {
    it('should return correct path for flashcards', () => {
      const result = getStorageKey(testDeckId, 'flashcards');
      expect(result).toBe('decks/deck-123/flashcards.json');
    });
  });

  describe('exam category', () => {
    it('should return correct path for exam', () => {
      const result = getStorageKey(testDeckId, 'exam');
      expect(result).toBe('decks/deck-123/exam.json');
    });
  });

  describe('unknown category', () => {
    it('should throw error for unknown category', () => {
      expect(() => getStorageKey(testDeckId, 'unknown' as ContentType)).toThrow(
        'Unknown category: unknown'
      );
    });
  });

  describe('various deck IDs', () => {
    it('should handle UUID-style deck IDs', () => {
      const result = getStorageKey('550e8400-e29b-41d4-a716-446655440000', 'summary');
      expect(result).toBe('decks/550e8400-e29b-41d4-a716-446655440000/summary.json');
    });

    it('should handle deck IDs with special characters', () => {
      const result = getStorageKey('deck_with-special.chars', 'flashcards');
      expect(result).toBe('decks/deck_with-special.chars/flashcards.json');
    });
  });
});

describe('getAllDeckKeys', () => {
  const testDeckId = 'deck-456';

  describe('with fileType provided', () => {
    it('should return 5 keys when fileType is pdf', () => {
      const keys = getAllDeckKeys(testDeckId, 'pdf');
      expect(keys).toHaveLength(5);
    });

    it('should include all content type keys', () => {
      const keys = getAllDeckKeys(testDeckId, 'pdf');
      expect(keys).toContain('decks/deck-456/extracted.json');
      expect(keys).toContain('decks/deck-456/summary.json');
      expect(keys).toContain('decks/deck-456/flashcards.json');
      expect(keys).toContain('decks/deck-456/exam.json');
    });

    it('should include original key with specified fileType', () => {
      const keys = getAllDeckKeys(testDeckId, 'pdf');
      expect(keys).toContain('decks/deck-456/original.pdf');
      expect(keys).not.toContain('decks/deck-456/original.pptx');
    });

    it('should work with pptx fileType', () => {
      const keys = getAllDeckKeys(testDeckId, 'pptx');
      expect(keys).toContain('decks/deck-456/original.pptx');
      expect(keys).not.toContain('decks/deck-456/original.pdf');
    });
  });

  describe('without fileType provided', () => {
    it('should return 6 keys when fileType is not provided', () => {
      const keys = getAllDeckKeys(testDeckId);
      expect(keys).toHaveLength(6);
    });

    it('should include both pdf and pptx original variants', () => {
      const keys = getAllDeckKeys(testDeckId);
      expect(keys).toContain('decks/deck-456/original.pdf');
      expect(keys).toContain('decks/deck-456/original.pptx');
    });

    it('should include all content type keys', () => {
      const keys = getAllDeckKeys(testDeckId);
      expect(keys).toContain('decks/deck-456/extracted.json');
      expect(keys).toContain('decks/deck-456/summary.json');
      expect(keys).toContain('decks/deck-456/flashcards.json');
      expect(keys).toContain('decks/deck-456/exam.json');
    });
  });

  describe('key format', () => {
    it('should have all keys start with decks/{deckId}/', () => {
      const keys = getAllDeckKeys(testDeckId);
      for (const key of keys) {
        expect(key).toMatch(new RegExp(`^decks/${testDeckId}/`));
      }
    });

    it('should handle different deck IDs correctly', () => {
      const keys = getAllDeckKeys('my-custom-deck');
      expect(keys[0]).toContain('decks/my-custom-deck/');
    });
  });
});
