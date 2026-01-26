import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logError } from "@/lib/logger";
import { resetPasswordSchema, validationErrorResponse } from "@/lib/validation";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Check rate limit
  const rateLimitResult = await checkRateLimit("auth");
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult);
  }

  try {
    const body = await req.json();

    // Validate request body
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(
        validation.error.issues[0]?.message || "Validation failed",
        validation.error.issues
      );
    }

    const { token, password: newPassword } = validation.data;

    // Find the token and check if it's valid and not expired
    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(schema.passwordResetTokens.token, token),
        gt(schema.passwordResetTokens.expiresAt, new Date())
      ),
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user's password
    await db
      .update(schema.users)
      .set({ hashedPassword, updatedAt: new Date() })
      .where(eq(schema.users.id, resetToken.userId));

    // Delete the used token (one-time use)
    await db
      .delete(schema.passwordResetTokens)
      .where(eq(schema.passwordResetTokens.id, resetToken.id));

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    await logError("Reset password error", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
