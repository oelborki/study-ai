import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;

  try {
    // Find team by invite code
    const team = await db.query.teams.findFirst({
      where: eq(schema.teams.inviteCode, code),
    });

    if (!team) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = await db.query.teamMembers.findFirst({
      where: and(
        eq(schema.teamMembers.teamId, team.id),
        eq(schema.teamMembers.userId, session.user.id)
      ),
    });

    if (existingMember) {
      return NextResponse.json({ team, alreadyMember: true });
    }

    // Add as member
    await db.insert(schema.teamMembers).values({
      teamId: team.id,
      userId: session.user.id,
      role: "member",
    });

    return NextResponse.json({ team, joined: true });
  } catch (error) {
    console.error("Failed to join team:", error);
    return NextResponse.json(
      { error: "Failed to join team" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    const team = await db.query.teams.findFirst({
      where: eq(schema.teams.inviteCode, code),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Count members
    const members = await db.query.teamMembers.findMany({
      where: eq(schema.teamMembers.teamId, team.id),
    });

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        memberCount: members.length,
      },
    });
  } catch (error) {
    console.error("Failed to get team:", error);
    return NextResponse.json(
      { error: "Failed to get team" },
      { status: 500 }
    );
  }
}
