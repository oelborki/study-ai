import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import os from "os";
import { mkdir, writeFile, unlink } from "fs/promises";
import { spawn } from "child_process";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import { getStorage, getStorageKey } from "@/lib/storage";

function runExtractor(filePath: string, scriptName: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const p = spawn("python", ["-X", "utf8", `scripts/${scriptName}`, filePath], {
      env: { ...process.env, PYTHONUTF8: "1" },
    });

    let stdout = "";
    let stderr = "";

    p.stdout.on("data", (d) => (stdout += d.toString()));
    p.stderr.on("data", (d) => (stderr += d.toString()));

    p.on("close", (code) => {
      if (code !== 0)
        return reject(new Error(stderr || `extractor exited ${code}`));
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error("Extractor output was not valid JSON"));
      }
    });
  });
}

export async function POST(req: Request) {
  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Detect file type
  const fileName = file.name.toLowerCase();
  const fileExt = fileName.endsWith(".pdf")
    ? "pdf"
    : fileName.endsWith(".pptx")
      ? "pptx"
      : null;

  if (!fileExt) {
    return NextResponse.json(
      { error: "Please upload a .pptx or .pdf file" },
      { status: 400 }
    );
  }

  // Generate deck ID
  const id = randomUUID();

  // Save file to temp directory (for Python extraction)
  const tempDir = path.join(os.tmpdir(), "study-ai-upload");
  await mkdir(tempDir, { recursive: true });
  const tempFilePath = path.join(tempDir, `${id}.${fileExt}`);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(tempFilePath, buf);

  try {
    // Extract content using appropriate script
    const scriptName = fileExt === "pdf" ? "extract_pdf.py" : "extract_pptx.py";
    const extracted = await runExtractor(tempFilePath, scriptName);

    // Check for extraction errors
    if (
      extracted &&
      typeof extracted === "object" &&
      "error" in extracted &&
      extracted.error
    ) {
      return NextResponse.json({ error: extracted.error }, { status: 400 });
    }

    // Create deck title from filename
    const title = file.name.replace(/\.(pptx|pdf)$/i, "");

    // Save deck to database first (prevents orphaned files if DB insert fails)
    await db.insert(schema.decks).values({
      id,
      userId: session.user.id,
      title,
      originalFileName: file.name,
      fileType: fileExt,
    });

    // Upload original file and extracted JSON to storage
    const storage = getStorage();
    const originalKey = getStorageKey(id, "original", fileExt);
    const extractedKey = getStorageKey(id, "extracted");

    await Promise.all([
      storage.put(originalKey, buf),
      storage.put(extractedKey, JSON.stringify(extracted, null, 2)),
    ]);

    // Redirect to deck page
    const baseUrl = process.env.NEXTAUTH_URL || req.url;
    return NextResponse.redirect(new URL(`/deck/${id}`, baseUrl), 303);
  } finally {
    // Clean up temp file
    try {
      await unlink(tempFilePath);
    } catch {
      // Ignore cleanup errors
    }
  }
}
