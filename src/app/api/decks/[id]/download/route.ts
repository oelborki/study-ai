import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getStorage, getStorageKey } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Get deck info
  const deck = await db.query.decks.findFirst({
    where: eq(schema.decks.id, id),
  });

  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  // Check authorization: owner or team member
  let hasAccess = false;

  if (deck.userId === session.user.id) {
    hasAccess = true;
  }

  if (!hasAccess && deck.teamId) {
    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(schema.teamMembers.teamId, deck.teamId),
        eq(schema.teamMembers.userId, session.user.id)
      ),
    });
    if (membership) hasAccess = true;
  }

  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Check if deck has original file
  if (!deck.fileType || deck.fileType === "manual") {
    return NextResponse.json(
      { error: "No original file available" },
      { status: 404 }
    );
  }

  const storage = getStorage();
  const key = getStorageKey(id, "original", deck.fileType);

  // Check if file exists
  const exists = await storage.exists(key);
  if (!exists) {
    return NextResponse.json(
      { error: "Original file not found" },
      { status: 404 }
    );
  }

  // For R2 storage, return signed URL
  // For local storage, stream the file directly
  const isR2 = process.env.STORAGE_PROVIDER?.toLowerCase() === "r2";

  if (isR2) {
    const signedUrl = await storage.getSignedUrl(key, 3600);
    return NextResponse.json({
      url: signedUrl,
      filename: deck.originalFileName || `${id}.${deck.fileType}`,
    });
  }

  // Local storage: stream the file
  const fileBuffer = await storage.get(key);
  const filename = deck.originalFileName || `${id}.${deck.fileType}`;

  const contentType =
    deck.fileType === "pdf"
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.presentationml.presentation";

  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": fileBuffer.length.toString(),
    },
  });
}
