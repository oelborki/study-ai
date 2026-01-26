import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getStorage, resetStorage, LocalStorageProvider, R2StorageProvider } from '@/lib/storage';

// Helper to set up R2 environment variables
const setupR2Env = () => {
  vi.stubEnv('R2_ACCOUNT_ID', 'test-account-id');
  vi.stubEnv('R2_ACCESS_KEY_ID', 'test-access-key');
  vi.stubEnv('R2_SECRET_ACCESS_KEY', 'test-secret-key');
  vi.stubEnv('R2_BUCKET_NAME', 'test-bucket');
};

describe('getStorage', () => {
  beforeEach(() => {
    // Reset storage instance before each test
    resetStorage();
  });

  afterEach(() => {
    // Clean up env vars
    vi.unstubAllEnvs();
    resetStorage();
  });

  it('should return LocalStorageProvider when STORAGE_PROVIDER is not set', () => {
    vi.stubEnv('STORAGE_PROVIDER', '');

    const storage = getStorage();

    expect(storage).toBeInstanceOf(LocalStorageProvider);
  });

  it('should return LocalStorageProvider when STORAGE_PROVIDER is undefined', () => {
    // Ensure the env var is not set
    delete process.env.STORAGE_PROVIDER;

    const storage = getStorage();

    expect(storage).toBeInstanceOf(LocalStorageProvider);
  });

  it('should return LocalStorageProvider when STORAGE_PROVIDER is "local"', () => {
    vi.stubEnv('STORAGE_PROVIDER', 'local');

    const storage = getStorage();

    expect(storage).toBeInstanceOf(LocalStorageProvider);
  });

  it('should return R2StorageProvider when STORAGE_PROVIDER is "r2"', () => {
    setupR2Env();
    vi.stubEnv('STORAGE_PROVIDER', 'r2');

    const storage = getStorage();

    expect(storage).toBeInstanceOf(R2StorageProvider);
  });

  it('should be case insensitive for "R2"', () => {
    setupR2Env();
    vi.stubEnv('STORAGE_PROVIDER', 'R2');

    const storage = getStorage();

    expect(storage).toBeInstanceOf(R2StorageProvider);
  });

  it('should be case insensitive for mixed case "r2"', () => {
    setupR2Env();
    vi.stubEnv('STORAGE_PROVIDER', 'r2');
    resetStorage();

    const storageLower = getStorage();
    expect(storageLower).toBeInstanceOf(R2StorageProvider);

    resetStorage();
    vi.stubEnv('STORAGE_PROVIDER', 'R2');

    const storageUpper = getStorage();
    expect(storageUpper).toBeInstanceOf(R2StorageProvider);
  });

  it('should return cached instance on subsequent calls', () => {
    vi.stubEnv('STORAGE_PROVIDER', 'local');

    const storage1 = getStorage();
    const storage2 = getStorage();

    expect(storage1).toBe(storage2);
  });

  it('should return same instance even if env var changes after first call', () => {
    setupR2Env();
    vi.stubEnv('STORAGE_PROVIDER', 'local');

    const storage1 = getStorage();

    // Change env var after first call
    vi.stubEnv('STORAGE_PROVIDER', 'r2');

    const storage2 = getStorage();

    // Should still be the same LocalStorageProvider instance
    expect(storage1).toBe(storage2);
    expect(storage2).toBeInstanceOf(LocalStorageProvider);
  });

  it('should return LocalStorageProvider for unknown provider values', () => {
    vi.stubEnv('STORAGE_PROVIDER', 'unknown');

    const storage = getStorage();

    expect(storage).toBeInstanceOf(LocalStorageProvider);
  });
});

describe('resetStorage', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    resetStorage();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetStorage();
  });

  it('should clear cached instance', () => {
    vi.stubEnv('STORAGE_PROVIDER', 'local');

    const storage1 = getStorage();

    resetStorage();

    const storage2 = getStorage();

    // After reset, should get a new instance
    expect(storage1).not.toBe(storage2);
  });

  it('should allow different provider after reset', () => {
    setupR2Env();
    vi.stubEnv('STORAGE_PROVIDER', 'local');

    const storage1 = getStorage();
    expect(storage1).toBeInstanceOf(LocalStorageProvider);

    resetStorage();
    vi.stubEnv('STORAGE_PROVIDER', 'r2');

    const storage2 = getStorage();
    expect(storage2).toBeInstanceOf(R2StorageProvider);
  });

  it('should not throw when called multiple times', () => {
    expect(() => {
      resetStorage();
      resetStorage();
      resetStorage();
    }).not.toThrow();
  });

  it('should not throw when called before getStorage', () => {
    expect(() => {
      resetStorage();
    }).not.toThrow();
  });
});
