import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import { randomUUID } from "crypto";
import { validationErrorResponse } from "@/lib/validation";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import { z } from "zod";

const createDeckSchema = z.object({
  title: z
    .string()
    .min(1, "Deck title is required")
    .max(200, "Deck title must be less than 200 characters")
    .trim(),
});

export async function POST(request: Request) {
  // Check rate limit
  const rateLimitResult = await checkRateLimit("general");
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  // Validate request body
  const validation = createDeckSchema.safeParse(body);
  if (!validation.success) {
    return validationErrorResponse(
      validation.error.issues[0]?.message || "Validation failed",
      validation.error.issues
    );
  }

  const { title } = validation.data;

  const id = randomUUID();

  await db.insert(schema.decks).values({
    id,
    userId: session.user.id,
    title,
    fileType: "manual",
    originalFileName: null,
  });

  return NextResponse.json({ id });
}
