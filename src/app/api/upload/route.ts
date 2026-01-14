import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { spawn } from "child_process";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";

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

  // Save file to /data with appropriate extension
  const id = randomUUID();
  const dataDir = path.join(process.cwd(), "data");
  await mkdir(dataDir, { recursive: true });

  const filePath = path.join(dataDir, `${id}.${fileExt}`);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buf);

  // Extract content using appropriate script
  const scriptName = fileExt === "pdf" ? "extract_pdf.py" : "extract_pptx.py";
  const extracted = await runExtractor(filePath, scriptName);

  // Check for extraction errors
  if (
    extracted &&
    typeof extracted === "object" &&
    "error" in extracted &&
    extracted.error
  ) {
    return NextResponse.json({ error: extracted.error }, { status: 400 });
  }

  // Save extracted JSON
  const jsonPath = path.join(dataDir, `${id}.json`);
  await writeFile(jsonPath, JSON.stringify(extracted, null, 2), "utf8");

  // Create deck title from filename
  const title = file.name.replace(/\.(pptx|pdf)$/i, "");

  // Save deck to database
  await db.insert(schema.decks).values({
    id,
    userId: session.user.id,
    title,
    originalFileName: file.name,
    fileType: fileExt,
  });

  // Redirect to deck page
  return NextResponse.redirect(new URL(`/deck/${id}`, req.url), 303);
}
