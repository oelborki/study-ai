import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Capture a test message
    Sentry.captureMessage("Test message from Sentry API route", "info");

    // Throw an error to test exception capture
    throw new Error("Test Sentry error - this is intentional!");
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({
      success: true,
      message: "Test error sent to Sentry! Check your Sentry dashboard.",
    });
  }
}
