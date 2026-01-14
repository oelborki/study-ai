import fs from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";
import GenerateButtons from "./GenerateButtons";

export default async function DeckPage(
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const deckPath = path.join(process.cwd(), "data", `${id}.json`);

    let raw: string;
    try {
        raw = await fs.readFile(deckPath, "utf8");
    } catch {
        notFound();
    }

    const deck = JSON.parse(raw);

    return (
        <main className="min-h-[calc(100vh-73px)] px-6 py-12 bg-gradient-to-b from-[#1a0033] via-[#000000] to-[#000000]">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-white tracking-tight">Your Study Materials</h1>
                <p className="mt-3 text-lg text-[#A3A3A3]">Choose a study mode to get started.</p>

                <GenerateButtons deckId={id} />
            </div>
        </main>
    );
}
