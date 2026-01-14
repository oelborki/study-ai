import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify the user owns this deck
    const deck = await db.query.decks.findFirst({
      where: and(
        eq(schema.decks.id, id),
        eq(schema.decks.userId, session.user.id)
      ),
    });

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Delete the deck from database (cascade will handle shares)
    await db.delete(schema.decks).where(eq(schema.decks.id, id));

    // Delete the JSON file
    const deckPath = path.join(process.cwd(), "data", `${id}.json`);
    try {
      await fs.unlink(deckPath);
    } catch {
      // File might not exist, that's okay
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete deck:", error);
    return NextResponse.json({ error: "Failed to delete deck" }, { status: 500 });
  }
}
