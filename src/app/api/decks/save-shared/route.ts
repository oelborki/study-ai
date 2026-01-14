import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { shareCode } = await request.json();

    if (!shareCode) {
      return NextResponse.json({ error: "Share code required" }, { status: 400 });
    }

    // Find the active share link
    const share = await db.query.deckShares.findFirst({
      where: and(
        eq(schema.deckShares.shareCode, shareCode),
        eq(schema.deckShares.isActive, true)
      ),
    });

    if (!share) {
      return NextResponse.json({ error: "Share link not found or inactive" }, { status: 404 });
    }

    // Get the original deck
    const originalDeck = await db.query.decks.findFirst({
      where: eq(schema.decks.id, share.deckId),
    });

    if (!originalDeck) {
      return NextResponse.json({ error: "Original deck not found" }, { status: 404 });
    }

    // Generate new deck ID
    const newDeckId = crypto.randomUUID();

    // Copy the slides JSON file
    const originalPath = path.join(process.cwd(), "data", `${originalDeck.id}.json`);
    const newPath = path.join(process.cwd(), "data", `${newDeckId}.json`);

    try {
      await fs.copyFile(originalPath, newPath);
    } catch {
      return NextResponse.json({ error: "Failed to copy deck data" }, { status: 500 });
    }

    // Create the new deck record
    await db.insert(schema.decks).values({
      id: newDeckId,
      userId: session.user.id,
      title: originalDeck.title,
      description: originalDeck.description,
      originalFileName: originalDeck.originalFileName,
      fileType: originalDeck.fileType,
    });

    return NextResponse.json({ deckId: newDeckId });
  } catch (error) {
    console.error("Failed to save shared deck:", error);
    return NextResponse.json({ error: "Failed to save deck" }, { status: 500 });
  }
}
