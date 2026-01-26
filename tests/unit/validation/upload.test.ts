import { describe, it, expect } from 'vitest';
import {
  FILE_SIZE_LIMITS,
  ALLOWED_MIME_TYPES,
  MAGIC_BYTES,
  getFileTypeFromMime,
  validateMagicBytes,
  uploadMetadataSchema,
} from '@/lib/validation/schemas/upload';

describe('FILE_SIZE_LIMITS', () => {
  it('should have correct PDF size limit (50MB)', () => {
    expect(FILE_SIZE_LIMITS.PDF).toBe(50 * 1024 * 1024);
  });

  it('should have correct PPTX size limit (100MB)', () => {
    expect(FILE_SIZE_LIMITS.PPTX).toBe(100 * 1024 * 1024);
  });
});

describe('ALLOWED_MIME_TYPES', () => {
  it('should have correct PDF MIME type', () => {
    expect(ALLOWED_MIME_TYPES.PDF).toBe('application/pdf');
  });

  it('should have correct PPTX MIME type', () => {
    expect(ALLOWED_MIME_TYPES.PPTX).toBe(
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
  });
});

describe('MAGIC_BYTES', () => {
  it('should have correct PDF magic bytes (%PDF)', () => {
    expect(MAGIC_BYTES.PDF).toEqual([0x25, 0x50, 0x44, 0x46]);
  });

  it('should have correct PPTX magic bytes (PK..)', () => {
    expect(MAGIC_BYTES.PPTX).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });
});

describe('getFileTypeFromMime', () => {
  it('should return PDF for PDF MIME type', () => {
    expect(getFileTypeFromMime('application/pdf')).toBe('PDF');
  });

  it('should return PPTX for PPTX MIME type', () => {
    expect(
      getFileTypeFromMime(
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      )
    ).toBe('PPTX');
  });

  it('should return null for unknown MIME types', () => {
    expect(getFileTypeFromMime('text/plain')).toBeNull();
    expect(getFileTypeFromMime('image/png')).toBeNull();
    expect(getFileTypeFromMime('application/json')).toBeNull();
    expect(getFileTypeFromMime('')).toBeNull();
  });

  it('should return null for similar but incorrect MIME types', () => {
    expect(getFileTypeFromMime('application/x-pdf')).toBeNull();
    expect(getFileTypeFromMime('application/PDF')).toBeNull();
  });
});

describe('validateMagicBytes', () => {
  describe('PDF validation', () => {
    it('should return true for valid PDF magic bytes', () => {
      // %PDF in hex: 0x25 0x50 0x44 0x46
      const buffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x00, 0x00]).buffer;
      expect(validateMagicBytes(buffer, 'PDF')).toBe(true);
    });

    it('should return false for invalid PDF magic bytes', () => {
      const buffer = new Uint8Array([0x00, 0x00, 0x00, 0x00]).buffer;
      expect(validateMagicBytes(buffer, 'PDF')).toBe(false);
    });

    it('should return false for PPTX bytes when expecting PDF', () => {
      const buffer = new Uint8Array([0x50, 0x4b, 0x03, 0x04]).buffer;
      expect(validateMagicBytes(buffer, 'PDF')).toBe(false);
    });
  });

  describe('PPTX validation', () => {
    it('should return true for valid PPTX magic bytes (ZIP signature)', () => {
      // PK.. in hex: 0x50 0x4B 0x03 0x04
      const buffer = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]).buffer;
      expect(validateMagicBytes(buffer, 'PPTX')).toBe(true);
    });

    it('should return false for invalid PPTX magic bytes', () => {
      const buffer = new Uint8Array([0x00, 0x00, 0x00, 0x00]).buffer;
      expect(validateMagicBytes(buffer, 'PPTX')).toBe(false);
    });

    it('should return false for PDF bytes when expecting PPTX', () => {
      const buffer = new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer;
      expect(validateMagicBytes(buffer, 'PPTX')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle buffer with exact 4 bytes', () => {
      const pdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer;
      expect(validateMagicBytes(pdfBuffer, 'PDF')).toBe(true);
    });

    it('should handle buffer smaller than 4 bytes', () => {
      const smallBuffer = new Uint8Array([0x25, 0x50]).buffer;
      expect(validateMagicBytes(smallBuffer, 'PDF')).toBe(false);
    });

    it('should handle empty buffer', () => {
      const emptyBuffer = new Uint8Array([]).buffer;
      expect(validateMagicBytes(emptyBuffer, 'PDF')).toBe(false);
    });
  });
});

describe('uploadMetadataSchema', () => {
  it('should accept empty object', () => {
    const result = uploadMetadataSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept valid teamId', () => {
    const result = uploadMetadataSchema.safeParse({ teamId: 'team-123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.teamId).toBe('team-123');
    }
  });

  it('should allow undefined teamId', () => {
    const result = uploadMetadataSchema.safeParse({ teamId: undefined });
    expect(result.success).toBe(true);
  });
});
