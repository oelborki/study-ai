import fs from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";

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

            <div className="mt-6 flex gap-3">
                <button className="rounded-md bg-black px-4 py-2 text-white">Summary</button>
                <button className="rounded-md bg-black px-4 py-2 text-white">Flashcards</button>
                <button className="rounded-md bg-black px-4 py-2 text-white">Practice Exam</button>
            </div>

            <h2 className="mt-8 text-xl font-semibold">Extracted Slides</h2>

            <div className="mt-4 space-y-4">
                {deck.slides?.map((s: any) => (
                    <div key={s.index} className="rounded-lg border p-4">
                        <div className="font-semibold">
                            Slide {s.index}: {s.title || "(no title found)"}
                        </div>

                        {s.bullets?.length > 0 && (
                            <ul className="mt-2 list-disc pl-5 text-sm">
                                {s.bullets.map((b: string, i: number) => (
                                    <li key={i}>{b}</li>
                                ))}
                            </ul>
                        )}

                        {s.notes && (
                            <div className="mt-3 text-sm text-gray-600">
                                <span className="font-medium">Notes:</span> {s.notes}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </main>
    );
}
