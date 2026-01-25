import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, gt } from "drizzle-orm";
import { sendPasswordResetEmail } from "@/lib/email";
import { logError } from "@/lib/logger";

export async function POST(req: Request) {
  let email: string | undefined;
  try {
    const body = await req.json();
    email = body.email;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    // Process only if user exists, but always return same response to prevent timing attacks
    if (user) {
      // Delete any existing reset tokens for this user
      await db
        .delete(schema.passwordResetTokens)
        .where(eq(schema.passwordResetTokens.userId, user.id));

      // Generate new token
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store the token
      await db.insert(schema.passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      });

      // Build reset URL and send email
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password/${token}`;
      const emailResult = await sendPasswordResetEmail(email, resetUrl);

      if (!emailResult.success) {
        await logError("Failed to send reset email", new Error(emailResult.error || "Unknown error"), { email });
      }
    }

    // Always return success to not reveal if email exists
    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, we sent a password reset link.",
    });
  } catch (error) {
    await logError("Forgot password error", error, { email });
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
