import { z } from "zod";

// File size limits in bytes
export const FILE_SIZE_LIMITS = {
  PDF: 50 * 1024 * 1024, // 50MB
  PPTX: 100 * 1024 * 1024, // 100MB
} as const;

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
  PDF: "application/pdf",
  PPTX: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
} as const;

// Magic bytes for file type verification
// PDF starts with %PDF
// PPTX (ZIP-based) starts with PK
export const MAGIC_BYTES = {
  PDF: [0x25, 0x50, 0x44, 0x46], // %PDF
  PPTX: [0x50, 0x4b, 0x03, 0x04], // PK.. (ZIP signature)
} as const;

export type FileType = keyof typeof FILE_SIZE_LIMITS;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  fileType?: FileType;
}

/**
 * Validates the magic bytes of a file buffer to verify actual file type
 */
export function validateMagicBytes(
  buffer: ArrayBuffer,
  expectedType: FileType
): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 4));
  const expected = MAGIC_BYTES[expectedType];

  return expected.every((byte, index) => bytes[index] === byte);
}

/**
 * Determines file type from MIME type
 */
export function getFileTypeFromMime(mimeType: string): FileType | null {
  if (mimeType === ALLOWED_MIME_TYPES.PDF) return "PDF";
  if (mimeType === ALLOWED_MIME_TYPES.PPTX) return "PPTX";
  return null;
}

/**
 * Validates an uploaded file for size, MIME type, and magic bytes
 */
export async function validateUploadedFile(
  file: File
): Promise<FileValidationResult> {
  // Check MIME type
  const fileType = getFileTypeFromMime(file.type);
  if (!fileType) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Only PDF and PPTX files are allowed.`,
    };
  }

  // Check file size
  const sizeLimit = FILE_SIZE_LIMITS[fileType];
  if (file.size > sizeLimit) {
    const limitMB = sizeLimit / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds limit. Maximum size for ${fileType} is ${limitMB}MB.`,
    };
  }

  // Check magic bytes
  try {
    const buffer = await file.slice(0, 4).arrayBuffer();
    if (!validateMagicBytes(buffer, fileType)) {
      return {
        valid: false,
        error: "File content does not match the declared file type.",
      };
    }
  } catch {
    return {
      valid: false,
      error: "Failed to read file for validation.",
    };
  }

  return {
    valid: true,
    fileType,
  };
}

// Schema for upload metadata
export const uploadMetadataSchema = z.object({
  teamId: z.string().optional(),
});

export type UploadMetadata = z.infer<typeof uploadMetadataSchema>;
