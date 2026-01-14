import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const memberships = await db.query.teamMembers.findMany({
      where: eq(schema.teamMembers.userId, session.user.id),
    });

    const teamIds = memberships.map((m) => m.teamId);

    if (teamIds.length === 0) {
      return NextResponse.json({ teams: [] });
    }

    const teams = await Promise.all(
      memberships.map(async (m) => {
        const team = await db.query.teams.findFirst({
          where: eq(schema.teams.id, m.teamId),
        });
        return team ? { ...team, role: m.role } : null;
      })
    );

    return NextResponse.json({
      teams: teams.filter(Boolean),
    });
  } catch (error) {
    console.error("Failed to fetch teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    const inviteCode = nanoid(8);

    const [team] = await db
      .insert(schema.teams)
      .values({
        name: name.trim(),
        ownerId: session.user.id,
        inviteCode,
      })
      .returning();

    // Add creator as owner member
    await db.insert(schema.teamMembers).values({
      teamId: team.id,
      userId: session.user.id,
      role: "owner",
    });

    return NextResponse.json({ team });
  } catch (error) {
    console.error("Failed to create team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
