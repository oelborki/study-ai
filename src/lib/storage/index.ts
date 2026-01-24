import type { StorageProvider } from "./types";
import { LocalStorageProvider } from "./local";
import { R2StorageProvider } from "./r2";

export type { StorageProvider } from "./types";
export { getStorageKey, getAllDeckKeys } from "./types";
export type { ContentType } from "./types";
export { LocalStorageProvider } from "./local";
export { R2StorageProvider } from "./r2";

let storageInstance: StorageProvider | null = null;

/**
 * Get the configured storage provider
 * Uses STORAGE_PROVIDER env var: "r2" for R2, anything else for local
 */
export function getStorage(): StorageProvider {
  if (storageInstance) {
    return storageInstance;
  }

  const provider = process.env.STORAGE_PROVIDER?.toLowerCase();

  if (provider === "r2") {
    storageInstance = new R2StorageProvider();
  } else {
    storageInstance = new LocalStorageProvider();
  }

  return storageInstance;
}

/**
 * Reset the storage instance (useful for testing)
 */
export function resetStorage(): void {
  storageInstance = null;
}
