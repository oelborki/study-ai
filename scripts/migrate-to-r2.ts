/**
 * Migration script to upload existing local files to R2
 *
 * Usage:
 *   npx tsx scripts/migrate-to-r2.ts
 *
 * Prerequisites:
 *   - Set R2 environment variables (R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)
 *   - Set DATABASE_URL environment variable
 *   - Ensure local data/ directory contains existing files
 */

import fs from "fs/promises";
import path from "path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import { R2StorageProvider } from "../src/lib/storage/r2";
import { getStorageKey } from "../src/lib/storage/types";

async function main() {
  console.log("Starting R2 migration...\n");

  // Initialize database connection
  if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  // Initialize R2 storage
  const r2 = new R2StorageProvider();

  // Get data directory path
  const dataDir = path.join(process.cwd(), "data");

  // Query all decks from database
  console.log("Fetching decks from database...");
  const decks = await db.query.decks.findMany();
  console.log(`Found ${decks.length} decks to migrate\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors: { deckId: string; file: string; error: string }[] = [];

  for (const deck of decks) {
    console.log(`Processing deck: ${deck.id} (${deck.title})`);

    // Files to migrate for this deck
    const filesToMigrate: { localName: string; storageKey: string }[] = [];

    // Extracted JSON (always present for non-manual decks)
    if (deck.fileType !== "manual") {
      filesToMigrate.push({
        localName: `${deck.id}.json`,
        storageKey: getStorageKey(deck.id, "extracted"),
      });
    }

    // Original file (PDF or PPTX)
    if (deck.fileType === "pdf" || deck.fileType === "pptx") {
      filesToMigrate.push({
        localName: `${deck.id}.${deck.fileType}`,
        storageKey: getStorageKey(deck.id, "original", deck.fileType),
      });
    }

    // Generated content files
    const generatedTypes = ["summary", "flashcards", "exam"] as const;
    for (const type of generatedTypes) {
      filesToMigrate.push({
        localName: `output_${deck.id}_${type}.json`,
        storageKey: getStorageKey(deck.id, type),
      });
    }

    // Upload each file
    for (const file of filesToMigrate) {
      const localPath = path.join(dataDir, file.localName);

      try {
        // Check if local file exists
        await fs.access(localPath);

        // Read and upload
        const content = await fs.readFile(localPath);
        await r2.put(file.storageKey, content);

        console.log(`  ✓ Uploaded: ${file.localName} → ${file.storageKey}`);
        successCount++;
      } catch (err) {
        const error = err as NodeJS.ErrnoException;
        if (error.code === "ENOENT") {
          // File doesn't exist (e.g., content not generated yet) - skip
          console.log(`  - Skipped (not found): ${file.localName}`);
        } else {
          // Actual error
          console.log(`  ✗ Error: ${file.localName} - ${error.message}`);
          errors.push({
            deckId: deck.id,
            file: file.localName,
            error: error.message,
          });
          errorCount++;
        }
      }
    }

    console.log();
  }

  // Summary
  console.log("=".repeat(50));
  console.log("Migration complete!\n");
  console.log(`  Files uploaded: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);

  if (errors.length > 0) {
    console.log("\nErrors:");
    for (const err of errors) {
      console.log(`  - Deck ${err.deckId}, file ${err.file}: ${err.error}`);
    }
  }

  console.log("\nNext steps:");
  console.log("  1. Verify files in R2 bucket");
  console.log("  2. Set STORAGE_PROVIDER=r2 in environment");
  console.log("  3. Test application functionality");
  console.log("  4. Keep local data/ directory as backup until verified");

  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
