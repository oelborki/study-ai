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
        <main className="min-h-screen p-8">
            <a href="/" className="text-sm underline">← Upload another</a>
            <h1 className="mt-3 text-2xl font-bold">Deck processed</h1>

            <GenerateButtons deckId={id} />
        </main>
    );
}
