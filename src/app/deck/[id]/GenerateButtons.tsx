"use client";

import { useMemo, useState } from "react";

type Flashcard = {
  q: string;
  a: string;
  refs: number[];
  difficulty: "easy" | "medium" | "hard";
};

function toCsv(flashcards: Flashcard[]) {
  const escape = (s: string) => `"${String(s).replaceAll('"', '""')}"`;
  const rows = [
    ["question", "answer", "refs", "difficulty"],
    ...flashcards.map((c) => [
      c.q ?? "",
      c.a ?? "",
      Array.isArray(c.refs) ? c.refs.join(",") : "",
      c.difficulty ?? "",
    ]),
  ];
  return rows.map((r) => r.map(escape).join(",")).join("\n");
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function GenerateButtons({ deckId }: { deckId: string }) {
  const [loading, setLoading] = useState<null | "summary" | "flashcards">(null);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<string | null>(null);

  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const current = useMemo(() => {
    if (!flashcards?.length) return null;
    return flashcards[Math.min(idx, flashcards.length - 1)];
  }, [flashcards, idx]);

  async function callGenerate(type: "summary" | "flashcards") {
    setError(null);
    setLoading(type);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Failed to generate ${type}`);
      return data;
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      return null;
    } finally {
      setLoading(null);
    }
  }

  async function generateSummary() {
    const data = await callGenerate("summary");
    if (data?.summary) setSummary(data.summary);
  }

  async function generateFlashcards() {
    const data = await callGenerate("flashcards");
    if (Array.isArray(data?.flashcards)) {
      setFlashcards(data.flashcards);
      setIdx(0);
      setRevealed(false);
    }
  }

  function nextCard() {
    if (!flashcards?.length) return;
    setIdx((i) => Math.min(i + 1, flashcards.length - 1));
    setRevealed(false);
  }

  function prevCard() {
    if (!flashcards?.length) return;
    setIdx((i) => Math.max(i - 1, 0));
    setRevealed(false);
  }

  function shuffleCards() {
    if (!flashcards?.length) return;
    const copy = [...flashcards];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setFlashcards(copy);
    setIdx(0);
    setRevealed(false);
  }

  function exportCsv() {
    if (!flashcards?.length) return;
    const csv = toCsv(flashcards);
    downloadText(`flashcards_${deckId}.csv`, csv);
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={generateSummary}
          disabled={loading !== null}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading === "summary" ? "Generating..." : "Summary"}
        </button>

        <button
          onClick={generateFlashcards}
          disabled={loading !== null}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading === "flashcards" ? "Generating..." : "Flashcards"}
        </button>

        <button
          disabled
          className="rounded-md bg-black px-4 py-2 text-white opacity-40"
          title="Next: Practice Exam"
        >
          Practice Exam
        </button>

        {flashcards?.length ? (
          <>
            <button
              onClick={shuffleCards}
              className="rounded-md border px-4 py-2"
              title="Shuffle flashcards"
            >
              Shuffle
            </button>
            <button
              onClick={exportCsv}
              className="rounded-md border px-4 py-2"
              title="Export to CSV"
            >
              Export CSV
            </button>
          </>
        ) : null}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {summary && (
        <div className="mt-6 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Summary</h2>
          <pre className="mt-2 whitespace-pre-wrap text-sm">{summary}</pre>
        </div>
      )}

      {flashcards?.length ? (
        <div className="mt-6 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Flashcards</h2>
            <div className="text-sm text-gray-600">
              {idx + 1} / {flashcards.length}
            </div>
          </div>

          {current && (
            <div className="mt-4">
              <div className="rounded-lg border p-4">
                <div className="text-sm text-gray-600">
                  Difficulty: <span className="font-medium">{current.difficulty}</span>
                  {Array.isArray(current.refs) && current.refs.length ? (
                    <span className="ml-3">
                      Refs: <span className="font-medium">{current.refs.join(", ")}</span>
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 text-base font-semibold">Q: {current.q}</div>

                <div className="mt-4">
                  {!revealed ? (
                    <button
                      onClick={() => setRevealed(true)}
                      className="rounded-md bg-black px-4 py-2 text-white"
                    >
                      Reveal Answer
                    </button>
                  ) : (
                    <div className="rounded-md bg-gray-50 p-3 text-sm whitespace-pre-wrap">
                      <div className="font-semibold mb-1">A:</div>
                      {current.a}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={prevCard}
                  disabled={idx === 0}
                  className="rounded-md border px-4 py-2 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={nextCard}
                  disabled={idx === flashcards.length - 1}
                  className="rounded-md border px-4 py-2 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
