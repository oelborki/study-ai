import fs from "fs/promises";
import path from "path";
import type { StorageProvider } from "./types";

/**
 * Local filesystem storage provider
 * Stores files in the data/ directory
 */
export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(process.cwd(), "data");
  }

  private getPath(key: string): string {
    return path.join(this.baseDir, key);
  }

  async put(key: string, data: Buffer | string): Promise<void> {
    const filePath = this.getPath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
  }

  async get(key: string): Promise<Buffer> {
    const filePath = this.getPath(key);
    return fs.readFile(filePath);
  }

  async getString(key: string): Promise<string> {
    const filePath = this.getPath(key);
    return fs.readFile(filePath, "utf8");
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getPath(key);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      // Ignore if file doesn't exist
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.getPath(key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    const sourcePath = this.getPath(sourceKey);
    const destPath = this.getPath(destKey);
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.copyFile(sourcePath, destPath);
  }

  async deleteMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.delete(key)));
  }
}
