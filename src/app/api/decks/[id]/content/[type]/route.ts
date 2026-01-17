import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const { id, type } = await params;

  if (!["summary", "flashcards", "exam"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const outPath = path.join(process.cwd(), "data", `output_${id}_${type}.json`);

  try {
    const content = await fs.readFile(outPath, "utf8");
    try {
      return NextResponse.json(JSON.parse(content));
    } catch {
      return NextResponse.json({ error: "Invalid content format" }, { status: 500 });
    }
  } catch {
    // Return empty structure if file doesn't exist
    const emptyContent: Record<string, unknown> = {
      deckId: id,
      type,
    };

    if (type === "summary") {
      emptyContent.summary = "";
    } else if (type === "flashcards") {
      emptyContent.flashcards = [];
    } else if (type === "exam") {
      emptyContent.exam = null;
    }

    return NextResponse.json(emptyContent);
  }
}
