import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: deckId } = await params;

  // Verify ownership
  const deck = await db.query.decks.findFirst({
    where: and(
      eq(schema.decks.id, deckId),
      eq(schema.decks.userId, session.user.id)
    ),
  });

  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  // Check for existing active share
  const existingShare = await db.query.deckShares.findFirst({
    where: and(
      eq(schema.deckShares.deckId, deckId),
      eq(schema.deckShares.isActive, true)
    ),
  });

  if (existingShare) {
    return NextResponse.json({ shareCode: existingShare.shareCode });
  }

  // Create new share link
  const shareCode = nanoid(10);

  await db.insert(schema.deckShares).values({
    deckId,
    shareCode,
  });

  return NextResponse.json({ shareCode });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: deckId } = await params;

  // Verify ownership
  const deck = await db.query.decks.findFirst({
    where: and(
      eq(schema.decks.id, deckId),
      eq(schema.decks.userId, session.user.id)
    ),
  });

  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  // Deactivate share
  await db
    .update(schema.deckShares)
    .set({ isActive: false })
    .where(eq(schema.deckShares.deckId, deckId));

  return NextResponse.json({ success: true });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: deckId } = await params;

  // Verify ownership
  const deck = await db.query.decks.findFirst({
    where: and(
      eq(schema.decks.id, deckId),
      eq(schema.decks.userId, session.user.id)
    ),
  });

  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  // Get active share
  const share = await db.query.deckShares.findFirst({
    where: and(
      eq(schema.deckShares.deckId, deckId),
      eq(schema.deckShares.isActive, true)
    ),
  });

  return NextResponse.json({ share: share || null });
}
