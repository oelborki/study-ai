"use client";

import { useMemo, useState } from "react";
import AnimatedPanel from "@/components/ui/AnimatedPanel";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

type Flashcard = {
    q: string;
    a: string;
    refs: number[];
    difficulty: "easy" | "medium" | "hard";
};

type ExamQuestion = {
    id: string;
    type: "mcq" | "short";
    question: string;
    choices?: string[];
    answer: string;
    explanation: string;
    refs: number[];
    difficulty: "easy" | "medium" | "hard";
};

type Exam = {
    title: string;
    instructions: string;
    questions: ExamQuestion[];
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
    const [loading, setLoading] = useState<null | "summary" | "flashcards" | "exam">(null);
    const [error, setError] = useState<string | null>(null);

    const [summary, setSummary] = useState<string | null>(null);

    const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
    const [idx, setIdx] = useState(0);
    const [revealed, setRevealed] = useState(false);

    const [exam, setExam] = useState<Exam | null>(null);
    const [qIdx, setQIdx] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);

    type ExamProgress = {
        selected?: string;      // for mcq: "A" | "B" | "C" | "D"
        shortText?: string;     // for short: what user typed
        graded?: boolean;       // answered/graded
        correct?: boolean;      // whether marked correct
    };

    const [progress, setProgress] = useState<Record<string, ExamProgress>>({});
    const [finished, setFinished] = useState(false);

    type View = "summary" | "flashcards" | "exam";
    const [active, setActive] = useState<View | null>(null);


    const current = useMemo(() => {
        if (!flashcards?.length) return null;
        return flashcards[Math.min(idx, flashcards.length - 1)];
    }, [flashcards, idx]);

    async function callGenerate(type: "summary" | "flashcards" | "exam") {
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
        setActive("summary");
        if (summary) return; // client-side cache
        const data = await callGenerate("summary");
        if (data?.summary) setSummary(data.summary);
    }

    async function generateFlashcards() {
        setActive("flashcards");
        if (flashcards?.length) return; // client-side cache
        const data = await callGenerate("flashcards");
        if (Array.isArray(data?.flashcards)) {
            setFlashcards(data.flashcards);
            setIdx(0);
            setRevealed(false);
        }
    }

    async function generateExam() {
        setActive("exam");
        if (exam?.questions?.length) return; // client-side cache
        const data = await callGenerate("exam");
        if (data?.exam?.questions?.length) {
            setExam(data.exam);
            setQIdx(0);
            setShowAnswer(false);
            setProgress({});
            setFinished(false);
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

    function scoreSummary() {
        if (!exam?.questions?.length) return { correct: 0, total: 0 };
        let correct = 0;
        let total = 0;
        for (const q of exam.questions) {
            const p = progress[q.id];
            if (!p?.graded) continue;
            total += 1;
            if (p.correct) correct += 1;
        }
        return { correct, total };
    }

    function canAdvanceCurrent() {
        if (!exam?.questions?.length) return false;
        const q = exam.questions[Math.min(qIdx, exam.questions.length - 1)];
        return !!progress[q.id]?.graded; // must be answered/graded
    }

    function goNextQuestion() {
        if (!exam?.questions?.length) return;
        const last = qIdx >= exam.questions.length - 1;
        if (last) {
            setFinished(true);
        } else {
            setQIdx((i) => i + 1);
            setShowAnswer(false);
        }
    }

    function retakeExam() {
        if (!exam) return;
        setProgress({});
        setQIdx(0);
        setShowAnswer(false);
        setFinished(false);
    }

    return (
        <div className="mt-6">
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={generateSummary}
                    disabled={loading !== null}
                    className={`rounded-lg px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:ring-offset-2 ${
                        active === "summary"
                            ? "bg-[#4169E1] ring-2 ring-[#365ECC] ring-offset-2 shadow-md"
                            : "bg-[#4169E1] hover:bg-[#365ECC] shadow-sm hover:shadow-md"
                    }`}
                >
                    {loading === "summary" ? "Generating..." : "Summary"}
                </button>

                <button
                    onClick={generateFlashcards}
                    disabled={loading !== null}
                    className={`rounded-lg px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:ring-offset-2 ${
                        active === "flashcards"
                            ? "bg-[#4169E1] ring-2 ring-[#365ECC] ring-offset-2 shadow-md"
                            : "bg-[#4169E1] hover:bg-[#365ECC] shadow-sm hover:shadow-md"
                    }`}
                >
                    {loading === "flashcards" ? "Generating..." : "Flashcards"}
                </button>

                <button
                    onClick={generateExam}
                    disabled={loading !== null}
                    className={`rounded-lg px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:ring-offset-2 ${
                        active === "exam"
                            ? "bg-[#4169E1] ring-2 ring-[#365ECC] ring-offset-2 shadow-md"
                            : "bg-[#4169E1] hover:bg-[#365ECC] shadow-sm hover:shadow-md"
                    }`}
                >
                    {loading === "exam" ? "Generating..." : "Practice Exam"}
                </button>

                {flashcards?.length ? (
                    <>
                        <button
                            onClick={shuffleCards}
                            className="rounded-lg border-2 border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                            title="Shuffle flashcards"
                        >
                            Shuffle
                        </button>
                        <button
                            onClick={exportCsv}
                            className="rounded-lg border-2 border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                            title="Export to CSV"
                        >
                            Export CSV
                        </button>
                    </>
                ) : null}
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            {active === "summary" && summary && (
                <AnimatedPanel activeKey="summary">
                    <div className="mt-8 rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 shadow-md">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                            Summary
                        </h2>
                        <MarkdownRenderer content={summary} />
                    </div>
                </AnimatedPanel>
            )}

            {active === "flashcards" && flashcards?.length ? (
                <AnimatedPanel activeKey="flashcards">
                    <div className="mt-8 rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 shadow-md">
                        <div className="flex items-center justify-between gap-3 mb-6 pb-3 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">Flashcards</h2>
                            <div className="text-sm text-gray-600 font-medium">
                                {idx + 1} / {flashcards.length}
                            </div>
                        </div>

                        {current && (
                            <div className="flex flex-col items-center">
                                <div className="flashcard-container w-full max-w-md mb-6">
                                    <div
                                        className={`flashcard ${revealed ? 'flipped' : ''}`}
                                        onClick={() => setRevealed(!revealed)}
                                    >
                                        {/* Front of card (Question) */}
                                        <div className="flashcard-front">
                                            <div className="text-xs text-gray-500 mb-2">
                                                Difficulty: {current.difficulty}
                                                {current.refs?.length ? ` • Refs: ${current.refs.join(', ')}` : ''}
                                            </div>
                                            <div className="text-lg font-semibold text-center flex-grow flex items-center justify-center">
                                                {current.q}
                                            </div>
                                            <div className="text-xs text-gray-400 text-center mt-2">
                                                Click to flip
                                            </div>
                                        </div>

                                        {/* Back of card (Answer) */}
                                        <div className="flashcard-back">
                                            <div className="text-sm font-semibold text-gray-600 mb-3 text-center">
                                                Answer:
                                            </div>
                                            <div className="text-base text-center flex-grow flex items-center justify-center whitespace-pre-wrap">
                                                {current.a}
                                            </div>
                                            <div className="text-xs text-gray-400 text-center mt-2">
                                                Click to flip back
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={prevCard}
                                        disabled={idx === 0}
                                        className="rounded-lg border-2 border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                                    >
                                        Prev
                                    </button>
                                    <button
                                        onClick={nextCard}
                                        disabled={idx === flashcards.length - 1}
                                        className="rounded-lg border-2 border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </AnimatedPanel>
            ) : null}
            {active === "exam" && exam?.questions?.length ? (
                <AnimatedPanel activeKey="exam">
                    <div className="mt-8 rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 shadow-md">
                        <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-200 mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">{exam.title || "Practice Exam"}</h2>

                            {!finished ? (
                                <div className="text-sm text-gray-600 font-medium">
                                    {qIdx + 1} / {exam.questions.length}
                                </div>
                            ) : null}
                        </div>

                        {exam.instructions && !finished ? (
                            <p className="mt-2 text-sm text-gray-600">{exam.instructions}</p>
                        ) : null}

                        {/* FINISHED SCREEN */}
                        {finished ? (
                            <div className="mt-4 rounded-lg border border-gray-200 p-6 bg-gray-50">
                                {(() => {
                                    const { correct, total } = scoreSummary();
                                    const percent = total ? Math.round((correct / total) * 100) : 0;

                                    return (
                                        <>
                                            <h3 className="text-lg font-semibold mb-2">Results</h3>
                                            <p className="mt-2 text-sm text-gray-700">
                                                Score: <span className="font-semibold">{correct}</span> /{" "}
                                                <span className="font-semibold">{total}</span>{" "}
                                                {total ? `(${percent}%)` : "(No graded questions yet)"}
                                            </p>

                                            <div className="mt-4 flex gap-3">
                                                <button
                                                    onClick={retakeExam}
                                                    className="rounded-lg bg-[#4169E1] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#365ECC] transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:ring-offset-2"
                                                >
                                                    Retake
                                                </button>

                                                <button
                                                    onClick={() => setFinished(false)}
                                                    className="rounded-lg border-2 border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                                                    title="Go back to review questions"
                                                >
                                                    Review
                                                </button>
                                            </div>

                                            <p className="mt-3 text-xs text-gray-500">
                                                Short-answer questions are scored based on your self-marking.
                                            </p>
                                        </>
                                    );
                                })()}
                            </div>
                        ) : (
                            /* QUESTION SCREEN */
                            <div className="mt-4 rounded-lg border border-gray-200 p-4 bg-white">
                                {(() => {
                                    const q = exam.questions[Math.min(qIdx, exam.questions.length - 1)];
                                    const p = progress[q.id] || {};

                                    // For MCQ we treat q.answer like "A" / "B" / "C" / "D"
                                    const correctLetter =
                                        typeof q.answer === "string" ? q.answer.trim().toUpperCase() : "";

                                    return (
                                        <>
                                            <div className="text-sm text-gray-600">
                                                Difficulty: <span className="font-medium">{q.difficulty}</span>
                                                {q.refs?.length ? (
                                                    <span className="ml-3">
                                                        Refs: <span className="font-medium">{q.refs.join(", ")}</span>
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div className="mt-3 text-base font-semibold">
                                                {q.id}: {q.question}
                                            </div>

                                            {/* MCQ */}
                                            {q.type === "mcq" && Array.isArray(q.choices) && q.choices.length ? (
                                                <div className="mt-4 space-y-2 text-sm">
                                                    {q.choices.map((choice, i) => {
                                                        // Expect choices like "A) ...", "B) ..."
                                                        const letter = choice.trim().slice(0, 1).toUpperCase();
                                                        const selected = p.selected === letter;

                                                        // After answered, show correct/incorrect styling via text only (no colors required)
                                                        const answered = !!p.graded;
                                                        const isCorrectChoice = letter === correctLetter;

                                                        return (
                                                            <button
                                                                key={i}
                                                                type="button"
                                                                disabled={loading !== null || answered}
                                                                onClick={() => {
                                                                    // User selects -> immediately reveal + lock answer
                                                                    const correct = letter === correctLetter;

                                                                    setProgress((prev) => ({
                                                                        ...prev,
                                                                        [q.id]: { selected: letter, graded: true, correct },
                                                                    }));
                                                                    setShowAnswer(true);
                                                                }}
                                                                className={`w-full rounded-lg px-4 py-3 text-left transition-all duration-200 disabled:cursor-not-allowed ${
                                                                    answered
                                                                        ? isCorrectChoice
                                                                            ? "bg-green-50 border-2 border-green-200 text-green-900"
                                                                            : selected
                                                                            ? "bg-red-50 border-2 border-red-200 text-red-900"
                                                                            : "border-2 border-gray-200 opacity-60"
                                                                        : "border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                                                                }`}
                                                                aria-pressed={selected}
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <span className="font-medium">{choice}</span>

                                                                    {answered ? (
                                                                        isCorrectChoice ? (
                                                                            <span className="text-xs font-semibold text-green-600">Correct</span>
                                                                        ) : selected ? (
                                                                            <span className="text-xs font-semibold text-red-600">Incorrect</span>
                                                                        ) : null
                                                                    ) : null}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}

                                                    {/* Reveal / Feedback */}
                                                    {p.graded && showAnswer ? (
                                                        <div className={`mt-4 rounded-lg border-2 p-4 text-sm whitespace-pre-wrap ${
                                                            p.correct
                                                                ? "bg-green-50 border-green-200"
                                                                : "bg-red-50 border-red-200"
                                                        }`}>
                                                            <div className={`font-semibold text-base ${
                                                                p.correct ? "text-green-700" : "text-red-700"
                                                            }`}>
                                                                {p.correct ? "Correct!" : "Incorrect"}
                                                            </div>
                                                            <div className="mt-2">
                                                                Correct answer: <span className="font-semibold">{correctLetter}</span>
                                                            </div>
                                                            {q.explanation ? (
                                                                <>
                                                                    <div className="mt-3 font-semibold">Explanation:</div>
                                                                    <div className="mt-1">{q.explanation}</div>
                                                                </>
                                                            ) : null}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ) : null}

                                            {/* SHORT ANSWER */}
                                            {q.type === "short" ? (
                                                <div className="mt-4">
                                                    <textarea
                                                        value={p.shortText ?? ""}
                                                        onChange={(e) =>
                                                            setProgress((prev) => ({
                                                                ...prev,
                                                                [q.id]: { ...(prev[q.id] || {}), shortText: e.target.value },
                                                            }))
                                                        }
                                                        className="w-full rounded-lg border-2 border-gray-300 p-3 text-sm focus:border-[#4169E1] focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:ring-opacity-20 transition-all"
                                                        rows={4}
                                                        placeholder="Type your answer here..."
                                                        disabled={loading !== null || p.graded}
                                                    />

                                                    {/* Actions before grading */}
                                                    {!p.graded ? (
                                                        <div className="mt-3 flex flex-wrap gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowAnswer(true)}
                                                                className="rounded-lg bg-[#4169E1] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#365ECC] transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:ring-offset-2"
                                                            >
                                                                Enter
                                                            </button>
                                                        </div>
                                                    ) : null}

                                                    {/* Revealed answer + grading */}
                                                    {showAnswer ? (
                                                        <div className="mt-4 rounded-lg border-2 border-gray-200 bg-gray-50 p-4 text-sm whitespace-pre-wrap">
                                                            <div className="font-semibold text-base">Correct answer:</div>
                                                            <div className="mt-1">{q.answer}</div>

                                                            {q.explanation ? (
                                                                <>
                                                                    <div className="mt-3 font-semibold">Explanation:</div>
                                                                    <div className="mt-1">{q.explanation}</div>
                                                                </>
                                                            ) : null}

                                                            {!p.graded ? (
                                                                <div className="mt-4 flex gap-3">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setProgress((prev) => ({
                                                                                ...prev,
                                                                                [q.id]: { ...(prev[q.id] || {}), graded: true, correct: true },
                                                                            }));
                                                                        }}
                                                                        className="rounded-lg border-2 border-green-300 bg-green-50 px-5 py-2.5 text-sm text-green-700 hover:bg-green-100 hover:border-green-400 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
                                                                    >
                                                                        I was correct
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setProgress((prev) => ({
                                                                                ...prev,
                                                                                [q.id]: { ...(prev[q.id] || {}), graded: true, correct: false },
                                                                            }));
                                                                        }}
                                                                        className="rounded-lg border-2 border-red-300 bg-red-50 px-5 py-2.5 text-sm text-red-700 hover:bg-red-100 hover:border-red-400 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                                                                    >
                                                                        I was incorrect
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className={`mt-3 text-sm font-medium ${
                                                                    p.correct ? "text-green-700" : "text-red-700"
                                                                }`}>
                                                                    Marked as: {p.correct ? "Correct" : "Incorrect"}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ) : null}


                                            {/* Navigation */}
                                            <div className="mt-5 flex gap-3">
                                                <button
                                                    onClick={() => {
                                                        setQIdx((i) => Math.max(i - 1, 0));
                                                        setShowAnswer(false);
                                                    }}
                                                    disabled={qIdx === 0}
                                                    className="rounded-lg border-2 border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                                                >
                                                    Prev
                                                </button>

                                                <button
                                                    onClick={goNextQuestion}
                                                    disabled={!canAdvanceCurrent()}
                                                    className="rounded-lg border-2 border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                                                    title={!canAdvanceCurrent() ? "Answer/grade this question first" : ""}
                                                >
                                                    {qIdx === exam.questions.length - 1 ? "Finish" : "Next"}
                                                </button>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </AnimatedPanel>
            ) : null}
        </div>
    );
}
