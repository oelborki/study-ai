import fs from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import GenerateButtons from "./GenerateButtons";

export default async function DeckPage(
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // Query database to get deck info
    const deck = await db.query.decks.findFirst({
        where: eq(schema.decks.id, id),
    });

    if (!deck) {
        notFound();
    }

    const isManual = deck.fileType === "manual";

    // For non-manual decks, require the JSON file (extracted content)
    if (!isManual) {
        const deckPath = path.join(process.cwd(), "data", `${id}.json`);
        try {
            await fs.readFile(deckPath, "utf8");
        } catch {
            notFound();
        }
    }

    return (
        <main className="min-h-[calc(100vh-73px)] px-6 py-12 bg-gradient-to-b from-[#1a0033] via-[#000000] to-[#000000]">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-white tracking-tight">
                    {isManual ? deck.title : "Your Study Materials"}
                </h1>
                <p className="mt-3 text-lg text-[#A3A3A3]">
                    {isManual
                        ? "Add your notes and study materials below."
                        : "Choose a study mode to get started."}
                </p>

                <GenerateButtons deckId={id} isManual={isManual} />
            </div>
        </main>
    );
}
