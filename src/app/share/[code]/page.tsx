import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";
import GenerateButtons from "@/app/deck/[id]/GenerateButtons";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function SharedDeckPage({ params }: PageProps) {
  const { code } = await params;

  // Find the share link
  const share = await db.query.deckShares.findFirst({
    where: and(
      eq(schema.deckShares.shareCode, code),
      eq(schema.deckShares.isActive, true)
    ),
  });

  if (!share) {
    notFound();
  }

  // Get the deck info
  const deck = await db.query.decks.findFirst({
    where: eq(schema.decks.id, share.deckId),
  });

  if (!deck) {
    notFound();
  }

  // Load extracted slides
  const deckPath = path.join(process.cwd(), "data", `${deck.id}.json`);
  let slides: { index: number; title?: string; bullets?: string[] }[] = [];

  try {
    const raw = await fs.readFile(deckPath, "utf8");
    const data = JSON.parse(raw);
    slides = data.slides || [];
  } catch {
    // File not found, show empty
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-gradient-to-b from-[#1a0033] via-[#000000] to-[#000000]">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Shared badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#6B21A8]/20 border border-[#6B21A8]/30 px-4 py-1.5">
          <svg className="w-4 h-4 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="text-sm text-[#A855F7]">Shared Deck</span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">{deck.title}</h1>
        <p className="text-[#A3A3A3] mb-8">
          {slides.length} {slides.length === 1 ? "slide" : "slides"}
        </p>

        <GenerateButtons deckId={deck.id} />

        {/* Slide preview */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-white mb-4">Slide Content</h2>
          <div className="space-y-4">
            {slides.slice(0, 10).map((slide) => (
              <div
                key={slide.index}
                className="rounded-lg border border-[#404040] bg-[#121212] p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-[#737373] bg-[#1A1A1A] px-2 py-0.5 rounded">
                    Slide {slide.index}
                  </span>
                </div>
                {slide.title && (
                  <h3 className="text-lg font-medium text-white mb-2">
                    {slide.title}
                  </h3>
                )}
                {slide.bullets && slide.bullets.length > 0 && (
                  <ul className="list-disc list-inside text-[#D4D4D4] space-y-1">
                    {slide.bullets.map((bullet, i) => (
                      <li key={i} className="text-sm">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {slides.length > 10 && (
              <p className="text-center text-[#737373] py-4">
                + {slides.length - 10} more slides
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
