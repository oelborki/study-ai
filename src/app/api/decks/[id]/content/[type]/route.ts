import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const { id, type } = await params;

  // Validate type first (cheap check)
  if (!["summary", "flashcards", "exam"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  // Check if deck exists
  const deck = await db.query.decks.findFirst({
    where: eq(schema.decks.id, id),
  });

  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  // Check authorization
  const session = await auth();
  let hasAccess = false;

  // Check 1: User owns the deck
  if (session?.user?.id && deck.userId === session.user.id) {
    hasAccess = true;
  }

  // Check 2: User is a team member
  if (!hasAccess && session?.user?.id && deck.teamId) {
    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(schema.teamMembers.teamId, deck.teamId),
        eq(schema.teamMembers.userId, session.user.id)
      ),
    });
    if (membership) hasAccess = true;
  }

  if (!hasAccess) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Read and return content
  const outPath = path.join(process.cwd(), "data", `output_${id}_${type}.json`);

  try {
    const content = await fs.readFile(outPath, "utf8");
    try {
      return NextResponse.json(JSON.parse(content));
    } catch {
      return NextResponse.json({ error: "Invalid content format" }, { status: 500 });
    }
  } catch {
    // Return empty structure if file doesn't exist
    const emptyContent: Record<string, unknown> = {
      deckId: id,
      type,
    };

    if (type === "summary") {
      emptyContent.summary = "";
    } else if (type === "flashcards") {
      emptyContent.flashcards = [];
    } else if (type === "exam") {
      emptyContent.exam = null;
    }

    return NextResponse.json(emptyContent);
  }
}
