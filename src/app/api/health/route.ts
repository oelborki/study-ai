import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import OpenAI from "openai";
import os from "os";

// Lazy initialization for OpenAI client
let openai: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  latency_ms?: number;
  error?: string;
}

interface DetailedHealth {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    database: HealthCheck;
    openai: HealthCheck;
  };
  system: {
    memory_used_mb: number;
    memory_total_mb: number;
    memory_percent: number;
    uptime_seconds: number;
    node_version: string;
  };
}

interface BasicHealth {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    // Simple query to verify database connectivity
    await db.execute(sql`SELECT 1`);
    return {
      status: "healthy",
      latency_ms: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      latency_ms: Date.now() - start,
      error: error instanceof Error ? error.message : "Database connection failed",
    };
  }
}

async function checkOpenAI(): Promise<HealthCheck> {
  const client = getOpenAI();
  if (!client) {
    return {
      status: "degraded",
      error: "OpenAI API key not configured",
    };
  }

  const start = Date.now();
  try {
    // Minimal API call to verify connectivity - list models is lightweight
    await client.models.list();
    return {
      status: "healthy",
      latency_ms: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      latency_ms: Date.now() - start,
      error: error instanceof Error ? error.message : "OpenAI API check failed",
    };
  }
}

function getSystemMetrics() {
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const usedMem = memUsage.heapUsed + memUsage.external;

  return {
    memory_used_mb: Math.round(usedMem / 1024 / 1024),
    memory_total_mb: Math.round(totalMem / 1024 / 1024),
    memory_percent: Math.round((usedMem / totalMem) * 100),
    uptime_seconds: Math.round(process.uptime()),
    node_version: process.version,
  };
}

function determineOverallStatus(
  dbCheck: HealthCheck,
  openaiCheck: HealthCheck
): "healthy" | "degraded" | "unhealthy" {
  // Database is critical - if it's down, we're unhealthy
  if (dbCheck.status === "unhealthy") {
    return "unhealthy";
  }

  // OpenAI degraded is acceptable (app can still function for viewing)
  if (openaiCheck.status === "unhealthy") {
    return "degraded";
  }

  if (dbCheck.status === "degraded" || openaiCheck.status === "degraded") {
    return "degraded";
  }

  return "healthy";
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.HEALTH_CHECK_SECRET;
  if (!secret) return false;

  // Check query parameter
  const url = new URL(request.url);
  const keyParam = url.searchParams.get("key");
  if (keyParam === secret) return true;

  // Check header
  const keyHeader = request.headers.get("X-Health-Key");
  if (keyHeader === secret) return true;

  return false;
}

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const authorized = isAuthorized(request);

  if (!authorized) {
    // Public response - just basic status
    const dbCheck = await checkDatabase();
    const status = dbCheck.status === "healthy" ? "healthy" : "unhealthy";

    const response: BasicHealth = {
      status,
      timestamp,
    };

    return NextResponse.json(response, {
      status: status === "healthy" ? 200 : 503,
    });
  }

  // Authorized - return detailed health info
  const [dbCheck, openaiCheck] = await Promise.all([
    checkDatabase(),
    checkOpenAI(),
  ]);

  const overallStatus = determineOverallStatus(dbCheck, openaiCheck);
  const systemMetrics = getSystemMetrics();

  const response: DetailedHealth = {
    status: overallStatus,
    timestamp,
    checks: {
      database: dbCheck,
      openai: openaiCheck,
    },
    system: systemMetrics,
  };

  return NextResponse.json(response, {
    status: overallStatus === "unhealthy" ? 503 : 200,
  });
}
