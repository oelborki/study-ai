/**
 * Storage provider interface for abstracting file storage
 * Supports both local filesystem and cloud storage (R2/S3)
 */
export interface StorageProvider {
  /**
   * Store data at the given key
   */
  put(key: string, data: Buffer | string): Promise<void>;

  /**
   * Retrieve data as a Buffer
   */
  get(key: string): Promise<Buffer>;

  /**
   * Retrieve data as a UTF-8 string
   */
  getString(key: string): Promise<string>;

  /**
   * Delete a single file
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a file exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Copy a file from source to destination
   */
  copy(sourceKey: string, destKey: string): Promise<void>;

  /**
   * Delete multiple files (ignores files that don't exist)
   */
  deleteMany(keys: string[]): Promise<void>;

  /**
   * Generate a signed URL for temporary file access
   * @param key - The storage key
   * @param expiresIn - URL expiration in seconds (default 3600 = 1 hour)
   * @returns A URL that grants temporary access to the file
   */
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}

export type ContentType = 'original' | 'extracted' | 'summary' | 'flashcards' | 'exam';

/**
 * Generate a storage key for deck files
 * @param deckId - The deck ID
 * @param category - The type of content
 * @param fileExt - File extension (required for 'original' category)
 */
export function getStorageKey(
  deckId: string,
  category: ContentType,
  fileExt?: string
): string {
  switch (category) {
    case 'original':
      if (!fileExt) throw new Error('fileExt required for original files');
      return `decks/${deckId}/original.${fileExt}`;
    case 'extracted':
      return `decks/${deckId}/extracted.json`;
    case 'summary':
      return `decks/${deckId}/summary.json`;
    case 'flashcards':
      return `decks/${deckId}/flashcards.json`;
    case 'exam':
      return `decks/${deckId}/exam.json`;
    default:
      throw new Error(`Unknown category: ${category}`);
  }
}

/**
 * Get all possible storage keys for a deck (for deletion)
 */
export function getAllDeckKeys(deckId: string, fileType?: string): string[] {
  const keys = [
    `decks/${deckId}/extracted.json`,
    `decks/${deckId}/summary.json`,
    `decks/${deckId}/flashcards.json`,
    `decks/${deckId}/exam.json`,
  ];

  // Add original file keys for both extensions (one will exist, one won't)
  if (fileType) {
    keys.push(`decks/${deckId}/original.${fileType}`);
  } else {
    keys.push(`decks/${deckId}/original.pdf`);
    keys.push(`decks/${deckId}/original.pptx`);
  }

  return keys;
}
