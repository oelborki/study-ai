import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { sendWelcomeEmail } from "@/lib/email";
import { logError } from "@/lib/logger";
import { registerSchema, validationErrorResponse } from "@/lib/validation";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Check rate limit
  const rateLimitResult = await checkRateLimit("auth");
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult);
  }

  let email: string | undefined;
  try {
    const body = await req.json();

    // Validate request body
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(
        validation.error.issues[0]?.message || "Validation failed",
        validation.error.issues
      );
    }

    const { email: validatedEmail, password, name } = validation.data;
    email = validatedEmail;

    const existingUser = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [newUser] = await db
      .insert(schema.users)
      .values({
        email,
        name: name || email.split("@")[0],
        hashedPassword,
      })
      .returning();

    // Fire and forget - don't block registration
    sendWelcomeEmail(email, name || email.split("@")[0]).catch(async (error) => {
      await logError("Failed to send welcome email", error, { email });
    });

    return NextResponse.json({ success: true, userId: newUser.id });
  } catch (error) {
    await logError("Registration error", error, { email });
    return NextResponse.json(
      { error: "Failed to register. Please try again." },
      { status: 500 }
    );
  }
}
