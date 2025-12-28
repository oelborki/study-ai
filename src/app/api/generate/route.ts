import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

type GenerateType = "summary" | "flashcards";

function deckToText(deck: any) {
    const slides = Array.isArray(deck?.slides) ? deck.slides : [];

    const maxSlides = 60; // limit to 60 for now

    return slides.slice(0, maxSlides).map((s: any) => {
        const title = s.title ? `Title: ${s.title}` : "Title: (none)";
        const bullets = Array.isArray(s.bullets) && s.bullets.length
            ? `Bullets:\n- ${s.bullets.join("\n- ")}`
            : "Bullets: (none)";
        const notes = s.notes ? `Notes: ${s.notes}` : "Notes: (none)";
        return `Slide ${s.index}\n${title}\n${bullets}\n${notes}`;
    }).join("\n\n");
}

function extractJsonObject(text: string) {
    // Try direct parse first
    try {
        return JSON.parse(text);
    } catch { }

    // Fallback: extract first {...} block
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
        const candidate = text.slice(start, end + 1);
        return JSON.parse(candidate);
    }

    throw new Error("Model did not return valid JSON.");
}

export async function POST(req: Request) {
    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
            { error: "Missing OPENAI_API_KEY. Set it in .env.local" },
            { status: 500 }
        );
    }

    const body = await req.json().catch(() => null);
    const deckId = body?.deckId as string | undefined;
    const type = (body?.type as GenerateType | undefined) ?? "summary";

    if (!deckId) {
        return NextResponse.json({ error: "Missing deckId" }, { status: 400 });
    }
    if (type !== "summary" && type !== "flashcards") {
        return NextResponse.json({ error: "Unsupported type" }, { status: 400 });
    }

    const dataDir = path.join(process.cwd(), "data");
    const deckPath = path.join(dataDir, `${deckId}.json`);
    const outPath = path.join(dataDir, `output_${deckId}_${type}.json`);

    // Cache: if already generated, return it
    try {
        const cached = await fs.readFile(outPath, "utf8");
        return NextResponse.json(JSON.parse(cached));
    } catch {
        // no cache, continue
    }

    // Load extracted deck
    let deckRaw: string;
    try {
        deckRaw = await fs.readFile(deckPath, "utf8");
    } catch {
        return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const deck = JSON.parse(deckRaw);
    const deckText = deckToText(deck);

    const system = [
        "You are a study assistant.",
        "ONLY use information present in the provided slide content.",
        "If something is not in the slides, say: 'Not found in the deck.'",
        "Be concise and structured for studying.",
    ].join(" ");

    let userPrompt = "";
    let responseFormat: any = undefined;

    if (type === "summary") {
        userPrompt = `
Slide content:
${deckText}

Create a study summary with:
1) A 1-paragraph overview
2) 8–15 key bullets (high-yield)
3) A short "Things to memorize" list
4) A short "Common pitfalls / misconceptions" list (if applicable)
Include slide references in parentheses like (Slides 3–5) when possible.
Return in markdown.
`.trim();
    } else {
        // flashcards
        userPrompt = `
Slide content:
${deckText}

Create an appropriate number of flashcards to help a student study.

Return ONLY valid JSON in this exact shape:
{
  "flashcards": [
    {
      "q": "Question",
      "a": "Answer",
      "refs": [3,4],
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}

Rules:
- Use ONLY the slide content.
- Keep answers short (1–3 sentences or a compact list).
- refs must be slide numbers you used.
- Avoid trivia; focus on high-yield concepts.
`.trim();

        // Ask the model to return JSON only (reduces formatting issues)
        responseFormat = { type: "json_object" };
    }

    const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        ...(responseFormat ? { response_format: responseFormat } : {}),
        messages: [
            { role: "system", content: system },
            { role: "user", content: userPrompt },
        ],
    });

    const content = resp.choices?.[0]?.message?.content ?? "";

    let result: any;

    if (type === "summary") {
        result = {
            deckId,
            type,
            summary: content,
            createdAt: new Date().toISOString(),
            model: "gpt-4o-mini",
        };
    } else {
        const parsed = extractJsonObject(content);
        const flashcards = Array.isArray(parsed.flashcards) ? parsed.flashcards : [];

        result = {
            deckId,
            type,
            flashcards,
            createdAt: new Date().toISOString(),
            model: "gpt-4o-mini",
        };
    }

    await fs.writeFile(outPath, JSON.stringify(result, null, 2), "utf8");
    return NextResponse.json(result);

}
