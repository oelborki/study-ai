import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logError } from "@/lib/logger";
import { createTeamSchema, validationErrorResponse } from "@/lib/validation";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

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
    await logError("Failed to fetch teams", error, { userId: session.user.id });
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  // Check rate limit
  const rateLimitResult = await checkRateLimit("general");
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Validate request body
    const validation = createTeamSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(
        validation.error.issues[0]?.message || "Validation failed",
        validation.error.issues
      );
    }

    const { name } = validation.data;

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
    await logError("Failed to create team", error, { userId: session.user.id });
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
