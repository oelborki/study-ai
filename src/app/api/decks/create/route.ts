import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const title = body?.title?.trim();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

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
