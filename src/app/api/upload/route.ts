import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { spawn } from "child_process";

function runExtractor(pptxPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const p = spawn(
            "python",
            ["-X", "utf8", "scripts/extract_pptx.py", pptxPath],
            { env: { ...process.env, PYTHONUTF8: "1" } }
        );


        let stdout = "";
        let stderr = "";

        p.stdout.on("data", (d) => (stdout += d.toString()));
        p.stderr.on("data", (d) => (stderr += d.toString()));

        p.on("close", (code) => {
            if (code !== 0) return reject(new Error(stderr || `extractor exited ${code}`));
            try {
                resolve(JSON.parse(stdout));
            } catch {
                reject(new Error("Extractor output was not valid JSON"));
            }
        });
    });
}

export async function POST(req: Request) {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    //Save pptx to /data
    const id = randomUUID();
    const dataDir = path.join(process.cwd(), "data");
    await mkdir(dataDir, { recursive: true });

    const pptxPath = path.join(dataDir, `${id}.pptx`);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(pptxPath, buf);

    // Extract slide text -> JSON
    const extracted = await runExtractor(pptxPath);

    // Save extracted JSON
    const jsonPath = path.join(dataDir, `${id}.json`);
    await writeFile(jsonPath, JSON.stringify(extracted, null, 2), "utf8");

    // Redirect to deck page
    return NextResponse.redirect(new URL(`/deck/${id}`, req.url), 303);
}
