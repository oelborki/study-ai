import { Resend } from "resend";

// Lazy initialization to avoid build-time errors when API key is not set
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getResendClient();
    const { error } = await client.emails.send({
      from: process.env.EMAIL_FROM || "noreply@example.com",
      to: email,
      subject: "Reset your password",
      text: `You requested a password reset. Click the link below to set a new password:

${resetUrl}

This link expires in 1 hour.

If you didn't request this, you can ignore this email.`,
    });

    if (error) {
      console.error("Error sending password reset email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getResendClient();
    const { error } = await client.emails.send({
      from: process.env.EMAIL_FROM || "noreply@example.com",
      to: email,
      subject: "Welcome to QuickyNotes!",
      text: `Hi ${name},

Welcome to QuickyNotes! We're excited to have you.

Get started by uploading your first document and let AI transform it into study materials.

Prefer to write your own study notes instead? You can create and organize your own notes anytime—no AI required.

Happy studying!
The QuickyNotes Team`,
    });

    if (error) {
      console.error("Error sending welcome email:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
