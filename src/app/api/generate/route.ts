import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import OpenAI from "openai";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type GenerateType = "summary" | "flashcards" | "exam";

interface Slide {
  index: number;
  title?: string;
  bullets?: string[];
  notes?: string;
}

interface Deck {
  slides?: Slide[];
}

function deckToText(deck: Deck) {
  const slides = Array.isArray(deck?.slides) ? deck.slides : [];
  const maxSlides = 60;

  return slides
    .slice(0, maxSlides)
    .map((s: Slide) => {
      const title = s.title ? `Title: ${s.title}` : "Title: (none)";
      const bullets =
        Array.isArray(s.bullets) && s.bullets.length
          ? `Bullets:\n- ${s.bullets.join("\n- ")}`
          : "Bullets: (none)";
      const notes = s.notes ? `Notes: ${s.notes}` : "Notes: (none)";
      return `Slide ${s.index}\n${title}\n${bullets}\n${notes}`;
    })
    .join("\n\n");
}

function extractJsonObject(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    /* continue */
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = text.slice(start, end + 1);
    return JSON.parse(candidate);
  }

  throw new Error("Model did not return valid JSON.");
}

async function canAccessDeck(
  deckId: string,
  userId: string | undefined
): Promise<boolean> {
  // Get deck info from database
  const deck = await db.query.decks.findFirst({
    where: eq(schema.decks.id, deckId),
  });

  if (!deck) return false;

  // Owner can always access
  if (deck.userId === userId) return true;

  // Check if user is a team member with access
  if (userId && deck.teamId) {
    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(schema.teamMembers.teamId, deck.teamId),
        eq(schema.teamMembers.userId, userId)
      ),
    });
    if (membership) return true;
  }

  // Check for active share link (allows unauthenticated access)
  const share = await db.query.deckShares.findFirst({
    where: and(
      eq(schema.deckShares.deckId, deckId),
      eq(schema.deckShares.isActive, true)
    ),
  });

  return !!share;
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY. Set it in .env.local" },
      { status: 500 }
    );
  }

  const session = await auth();

  const body = await req.json().catch(() => null);
  const deckId = body?.deckId as string | undefined;
  const type = (body?.type as GenerateType | undefined) ?? "summary";

  if (!deckId) {
    return NextResponse.json({ error: "Missing deckId" }, { status: 400 });
  }
  if (type !== "summary" && type !== "flashcards" && type !== "exam") {
    return NextResponse.json({ error: "Unsupported type" }, { status: 400 });
  }

  // Check access permissions
  const hasAccess = await canAccessDeck(deckId, session?.user?.id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
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

  const deck = JSON.parse(deckRaw) as Deck;
  const deckText = deckToText(deck);

  const system = [
    "You are a study assistant.",
    "ONLY use information present in the provided slide content.",
    "If something is not in the slides, say: 'Not found in the deck.'",
    "Be concise and structured for studying.",
  ].join(" ");

  let userPrompt = "";
  let responseFormat: { type: "json_object" } | undefined = undefined;

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
  } else if (type === "flashcards") {
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

    responseFormat = { type: "json_object" };
  } else if (type === "exam") {
    userPrompt = `
Slide content:
${deckText}

Create a practice exam based ONLY on the slide content.

Return ONLY valid JSON in this exact shape:
{
  "exam": {
    "title": "Practice Exam",
    "instructions": "string",
    "questions": [
      {
        "id": "Q1",
        "type": "mcq" | "short",
        "question": "string",
        "choices": ["A) ...", "B) ...", "C) ...", "D) ..."],   // only for mcq
        "answer": "A" | "B" | "C" | "D" | "string",          // letter for mcq, text for short
        "explanation": "string",
        "refs": [3,4],
        "difficulty": "easy" | "medium" | "hard"
      }
    ]
  }
}

Rules:
- Make 12 questions total:
  - 8 multiple-choice (mcq, 4 choices each)
  - 4 short-answer (short)
- Use ONLY the slide content.
- Keep explanations short but helpful.
- refs must be slide numbers you used.
- If the deck doesn't support a question, DO NOT invent—omit it and generate fewer.
`.trim();

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

  interface FlashcardResult {
    deckId: string;
    type: "flashcards";
    flashcards: unknown[];
    createdAt: string;
    model: string;
  }

  interface ExamResult {
    deckId: string;
    type: "exam";
    exam: unknown;
    createdAt: string;
    model: string;
  }

  interface SummaryResult {
    deckId: string;
    type: "summary";
    summary: string;
    createdAt: string;
    model: string;
  }

  type Result = SummaryResult | FlashcardResult | ExamResult;

  let result: Result;

  if (type === "summary") {
    result = {
      deckId,
      type,
      summary: content,
      createdAt: new Date().toISOString(),
      model: "gpt-4o-mini",
    };
  } else if (type === "flashcards") {
    const parsed = extractJsonObject(content);
    const flashcards = Array.isArray(parsed.flashcards)
      ? parsed.flashcards
      : [];

    result = {
      deckId,
      type,
      flashcards,
      createdAt: new Date().toISOString(),
      model: "gpt-4o-mini",
    };
  } else {
    const parsed = extractJsonObject(content);
    const exam = parsed.exam ?? null;

    result = {
      deckId,
      type,
      exam,
      createdAt: new Date().toISOString(),
      model: "gpt-4o-mini",
    };
  }

  await fs.writeFile(outPath, JSON.stringify(result, null, 2), "utf8");
  return NextResponse.json(result);
}
