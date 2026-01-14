import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import { eq, or, inArray } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Get user's team memberships
    const memberships = await db.query.teamMembers.findMany({
      where: eq(schema.teamMembers.userId, userId),
    });
    const teamIds = memberships.map((m) => m.teamId);

    // Get personal decks + team decks
    let decks;
    if (teamIds.length > 0) {
      decks = await db.query.decks.findMany({
        where: or(
          eq(schema.decks.userId, userId),
          inArray(schema.decks.teamId, teamIds)
        ),
        orderBy: (decks, { desc }) => [desc(decks.createdAt)],
      });
    } else {
      decks = await db.query.decks.findMany({
        where: eq(schema.decks.userId, userId),
        orderBy: (decks, { desc }) => [desc(decks.createdAt)],
      });
    }

    return NextResponse.json({ decks });
  } catch (error) {
    console.error("Failed to fetch decks:", error);
    return NextResponse.json(
      { error: "Failed to fetch decks" },
      { status: 500 }
    );
  }
}
