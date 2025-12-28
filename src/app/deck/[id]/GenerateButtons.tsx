"use client";

import { useState } from "react";

export default function GenerateButtons({ deckId }: { deckId: string }) {
    const [loading, setLoading] = useState<null | "summary">(null);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<string | null>(null);

    async function generateSummary() {
        setError(null);
        setLoading("summary");
        try {
            const res = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deckId, type: "summary" }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Failed to generate summary");

            setSummary(data.summary);
        } catch (e: any) {
            setError(e.message || "Something went wrong");
        } finally {
            setLoading(null);
        }
    }

    return (
        <div className="mt-6">
            <div className="flex gap-3">
                <button
                    onClick={generateSummary}
                    disabled={loading !== null}
                    className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
                >
                    {loading === "summary" ? "Generating..." : "Summary"}
                </button>

                <button
                    disabled
                    className="rounded-md bg-black px-4 py-2 text-white opacity-40"
                    title="Next: Flashcards"
                >
                    Flashcards
                </button>

                <button
                    disabled
                    className="rounded-md bg-black px-4 py-2 text-white opacity-40"
                    title="Next: Practice Exam"
                >
                    Practice Exam
                </button>
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            {summary && (
                <div className="mt-6 rounded-lg border p-4">
                    <h2 className="text-lg font-semibold">Summary</h2>
                    <pre className="mt-2 whitespace-pre-wrap text-sm">{summary}</pre>
                </div>
            )}
        </div>
    );
}
