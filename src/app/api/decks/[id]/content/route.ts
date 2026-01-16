import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";

async function canEditDeck(deckId: string, userId: string): Promise<boolean> {
  const deck = await db.query.decks.findFirst({
    where: eq(schema.decks.id, deckId),
  });

  if (!deck) return false;

  // Owner can edit
  if (deck.userId === userId) return true;

  // Team members can edit
  if (deck.teamId) {
    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(schema.teamMembers.teamId, deck.teamId),
        eq(schema.teamMembers.userId, userId)
      ),
    });
    if (membership) return true;
  }

  return false;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: deckId } = await params;

  // Check edit permissions
  const canEdit = await canEditDeck(deckId, session.user.id);
  if (!canEdit) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const type = body?.type as "summary" | "flashcards" | undefined;
  const content = body?.content;

  if (!type || (type !== "summary" && type !== "flashcards")) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  if (content === undefined) {
    return NextResponse.json({ error: "Missing content" }, { status: 400 });
  }

  const dataDir = path.join(process.cwd(), "data");
  const outPath = path.join(dataDir, `output_${deckId}_${type}.json`);

  try {
    // Read existing file
    const existing = await fs.readFile(outPath, "utf8");
    const data = JSON.parse(existing);

    // Update the content
    if (type === "summary") {
      data.summary = content;
    } else if (type === "flashcards") {
      data.flashcards = content;
    }

    data.updatedAt = new Date().toISOString();

    // Write back
    await fs.writeFile(outPath, JSON.stringify(data, null, 2), "utf8");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save content:", error);
    return NextResponse.json(
      { error: "Failed to save content. Generate content first." },
      { status: 500 }
    );
  }
}
