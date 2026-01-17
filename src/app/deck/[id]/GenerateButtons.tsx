"use client";

import { useEffect, useMemo, useState } from "react";
import AnimatedPanel from "@/components/ui/AnimatedPanel";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ShareModal from "@/components/share/ShareModal";

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

export default function GenerateButtons({ deckId, isManual = false }: { deckId: string; isManual?: boolean }) {
    const [loading, setLoading] = useState<null | "summary" | "flashcards" | "exam">(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isShareOpen, setIsShareOpen] = useState(false);

    const [summary, setSummary] = useState<string | null>(null);
    const [isEditingSummary, setIsEditingSummary] = useState(false);
    const [editedSummary, setEditedSummary] = useState<string>("");

    const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
    const [idx, setIdx] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [editingCardIdx, setEditingCardIdx] = useState<number | null>(null);
    const [editedQuestion, setEditedQuestion] = useState("");
    const [editedAnswer, setEditedAnswer] = useState("");
    const [isNewCard, setIsNewCard] = useState(false);

    const [exam, setExam] = useState<Exam | null>(null);
    const [qIdx, setQIdx] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [editingExamIdx, setEditingExamIdx] = useState<number | null>(null);
    const [editedExamQuestion, setEditedExamQuestion] = useState("");
    const [editedExamAnswer, setEditedExamAnswer] = useState("");
    const [editedExamChoices, setEditedExamChoices] = useState<string[]>([]);
    const [editedExamExplanation, setEditedExamExplanation] = useState("");

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

    // Manual deck mode: edit vs study (default to study)
    const [manualMode, setManualMode] = useState<"edit" | "study">("study");

    // For manual decks, load existing content on mount
    useEffect(() => {
        if (!isManual) return;

        async function loadManualContent() {
            // Load summary
            try {
                const res = await fetch(`/api/decks/${deckId}/content/summary`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.summary) setSummary(data.summary);
                }
            } catch { /* ignore */ }

            // Load flashcards
            try {
                const res = await fetch(`/api/decks/${deckId}/content/flashcards`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data.flashcards) && data.flashcards.length > 0) {
                        setFlashcards(data.flashcards);
                    }
                }
            } catch { /* ignore */ }

            // Load exam
            try {
                const res = await fetch(`/api/decks/${deckId}/content/exam`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.exam?.questions?.length) {
                        setExam(data.exam);
                    }
                }
            } catch { /* ignore */ }
        }

        loadManualContent();
    }, [isManual, deckId]);

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

    // Save all content at once (for manual decks)
    async function saveAll() {
        setSaving(true);
        setError(null);
        try {
            const promises: Promise<Response>[] = [];

            // Save summary if it exists
            if (summary || editedSummary) {
                promises.push(
                    fetch(`/api/decks/${deckId}/content`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ type: "summary", content: summary || editedSummary }),
                    })
                );
            }

            // Save flashcards if they exist
            if (flashcards?.length) {
                promises.push(
                    fetch(`/api/decks/${deckId}/content`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ type: "flashcards", content: flashcards }),
                    })
                );
            }

            // Save exam if it exists
            if (exam?.questions?.length) {
                promises.push(
                    fetch(`/api/decks/${deckId}/content`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ type: "exam", content: exam }),
                    })
                );
            }

            const results = await Promise.all(promises);
            const failed = results.find(r => !r.ok);
            if (failed) {
                throw new Error("Failed to save some content");
            }
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Failed to save";
            setError(message);
        } finally {
            setSaving(false);
        }
    }

    // Manual mode: Render all sections expanded with Add interfaces
    if (isManual) {
        // Study mode - reuse the normal UI components
        if (manualMode === "study") {
            return (
                <div className="mt-6">
                    {/* Mode toggle */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setManualMode("edit")}
                                className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all"
                            >
                                Edit
                            </button>
                            <button
                                className="rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-5 py-2.5 text-sm font-medium text-white ring-2 ring-[#A855F7] ring-offset-2 ring-offset-black"
                            >
                                Study
                            </button>
                        </div>
                    </div>

                    {/* Study mode buttons */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        {summary && (
                            <button
                                onClick={() => setActive("summary")}
                                className={`rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-all ${
                                    active === "summary"
                                        ? "bg-gradient-to-br from-[#6B21A8] to-[#A855F7] ring-2 ring-[#A855F7] ring-offset-2 shadow-md"
                                        : "bg-gradient-to-br from-[#6B21A8] to-[#A855F7] hover:from-[#581C87] hover:to-[#9333EA]"
                                }`}
                            >
                                Summary
                            </button>
                        )}
                        {flashcards && flashcards.length > 0 && (
                            <button
                                onClick={() => { setActive("flashcards"); setIdx(0); setRevealed(false); }}
                                className={`rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-all ${
                                    active === "flashcards"
                                        ? "bg-gradient-to-br from-[#6B21A8] to-[#A855F7] ring-2 ring-[#A855F7] ring-offset-2 shadow-md"
                                        : "bg-gradient-to-br from-[#6B21A8] to-[#A855F7] hover:from-[#581C87] hover:to-[#9333EA]"
                                }`}
                            >
                                Flashcards
                            </button>
                        )}
                        {exam?.questions && exam.questions.length > 0 && (
                            <button
                                onClick={() => { setActive("exam"); setQIdx(0); setShowAnswer(false); setProgress({}); setFinished(false); }}
                                className={`rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-all ${
                                    active === "exam"
                                        ? "bg-gradient-to-br from-[#6B21A8] to-[#A855F7] ring-2 ring-[#A855F7] ring-offset-2 shadow-md"
                                        : "bg-gradient-to-br from-[#6B21A8] to-[#A855F7] hover:from-[#581C87] hover:to-[#9333EA]"
                                }`}
                            >
                                Practice Exam
                            </button>
                        )}
                    </div>

                    {!summary && !flashcards?.length && !exam?.questions?.length && (
                        <p className="text-[#A3A3A3]">No content yet. Switch to Edit mode to add content.</p>
                    )}

                    {/* Summary view */}
                    {active === "summary" && summary && (
                        <AnimatedPanel activeKey="summary">
                            <div className="rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-8 shadow-md">
                                <h2 className="text-2xl font-bold text-white mb-6 pb-3 border-b border-[#404040]">Summary</h2>
                                <MarkdownRenderer content={summary} />
                            </div>
                        </AnimatedPanel>
                    )}

                    {/* Flashcards study view */}
                    {active === "flashcards" && flashcards && flashcards.length > 0 && current && (
                        <AnimatedPanel activeKey="flashcards">
                            <div className="rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-8 shadow-md">
                                <div className="flex items-center justify-between gap-3 mb-6 pb-3 border-b border-[#404040]">
                                    <h2 className="text-2xl font-bold text-white">Flashcards</h2>
                                    <div className="text-sm text-[#A3A3A3] font-medium">{idx + 1} / {flashcards.length}</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="flashcard-container w-full max-w-md mb-6">
                                        <div className={`flashcard ${revealed ? 'flipped' : ''}`} onClick={() => setRevealed(!revealed)}>
                                            <div className="flashcard-front">
                                                <div className="text-xs text-[#A3A3A3] mb-2">Difficulty: {current.difficulty}</div>
                                                <div className="text-lg font-semibold text-center flex-grow flex items-center justify-center">{current.q}</div>
                                                <div className="text-xs text-[#737373] text-center mt-2">Click to flip</div>
                                            </div>
                                            <div className="flashcard-back">
                                                <div className="text-sm font-semibold text-[#D4D4D4] mb-3 text-center">Answer:</div>
                                                <div className="text-base text-center flex-grow flex items-center justify-center whitespace-pre-wrap">{current.a}</div>
                                                <div className="text-xs text-[#C084FC] text-center mt-2">Click to flip back</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => { setIdx(i => Math.max(i - 1, 0)); setRevealed(false); }} disabled={idx === 0} className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] disabled:opacity-50">Prev</button>
                                        <button onClick={() => { setIdx(i => Math.min(i + 1, flashcards.length - 1)); setRevealed(false); }} disabled={idx === flashcards.length - 1} className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] disabled:opacity-50">Next</button>
                                    </div>
                                </div>
                            </div>
                        </AnimatedPanel>
                    )}

                    {/* Exam study view - simplified version */}
                    {active === "exam" && exam?.questions && exam.questions.length > 0 && !finished && (
                        <AnimatedPanel activeKey="exam">
                            <div className="rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-8 shadow-md">
                                <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#404040] mb-4">
                                    <h2 className="text-2xl font-bold text-white">{exam.title || "Practice Exam"}</h2>
                                    <div className="text-sm text-[#A3A3A3] font-medium">{qIdx + 1} / {exam.questions.length}</div>
                                </div>
                                {(() => {
                                    const q = exam.questions[Math.min(qIdx, exam.questions.length - 1)];
                                    const p = progress[q.id] || {};
                                    const correctLetter = typeof q.answer === "string" ? q.answer.trim().toUpperCase() : "";

                                    return (
                                        <div className="rounded-lg border border-[#404040] p-4 bg-[#0A0A0A]">
                                            <div className="text-sm text-[#A3A3A3]">Difficulty: {q.difficulty}</div>
                                            <div className="mt-3 text-base font-semibold text-white">{q.id}: {q.question}</div>

                                            {q.type === "mcq" && q.choices?.length ? (
                                                <div className="mt-4 space-y-2">
                                                    {q.choices.map((choice, i) => {
                                                        const letter = choice.trim().slice(0, 1).toUpperCase();
                                                        const selected = p.selected === letter;
                                                        const answered = !!p.graded;
                                                        const isCorrectChoice = letter === correctLetter;

                                                        return (
                                                            <button
                                                                key={i}
                                                                disabled={answered}
                                                                onClick={() => {
                                                                    const correct = letter === correctLetter;
                                                                    setProgress(prev => ({ ...prev, [q.id]: { selected: letter, graded: true, correct } }));
                                                                    setShowAnswer(true);
                                                                }}
                                                                className={`w-full rounded-lg px-4 py-3 text-left transition-all ${
                                                                    answered
                                                                        ? isCorrectChoice ? "bg-[#052e16] border-2 border-[#166534] text-[#4ade80]"
                                                                        : selected ? "bg-[#450a0a] border-2 border-[#991b1b] text-[#f87171]"
                                                                        : "border-2 border-[#404040] opacity-60 text-[#737373]"
                                                                        : "border-2 border-[#404040] hover:border-[#525252] hover:bg-[#1A1A1A] text-[#D4D4D4]"
                                                                }`}
                                                            >
                                                                {choice}
                                                            </button>
                                                        );
                                                    })}
                                                    {p.graded && q.explanation && (
                                                        <div className="mt-4 rounded-lg border-2 border-[#404040] bg-[#121212] p-4 text-sm text-[#D4D4D4]">
                                                            <div className="font-semibold text-white">Explanation:</div>
                                                            <div className="mt-1">{q.explanation}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="mt-4">
                                                    <textarea
                                                        value={p.shortText ?? ""}
                                                        onChange={(e) => setProgress(prev => ({ ...prev, [q.id]: { ...prev[q.id], shortText: e.target.value } }))}
                                                        className="w-full rounded-lg border-2 border-[#404040] bg-[#0A0A0A] text-white p-3 text-sm"
                                                        rows={4}
                                                        placeholder="Type your answer..."
                                                        disabled={p.graded}
                                                    />
                                                    {!p.graded && (
                                                        <button onClick={() => setShowAnswer(true)} className="mt-3 rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-6 py-2.5 text-sm font-medium text-white">Show Answer</button>
                                                    )}
                                                    {showAnswer && (
                                                        <div className="mt-4 rounded-lg border-2 border-[#404040] bg-[#121212] p-4 text-sm text-[#D4D4D4]">
                                                            <div className="font-semibold text-white">Correct answer:</div>
                                                            <div className="mt-1">{q.answer}</div>
                                                            {q.explanation && <><div className="mt-3 font-semibold text-white">Explanation:</div><div className="mt-1">{q.explanation}</div></>}
                                                            {!p.graded && (
                                                                <div className="mt-4 flex gap-3">
                                                                    <button onClick={() => setProgress(prev => ({ ...prev, [q.id]: { ...prev[q.id], graded: true, correct: true } }))} className="rounded-lg border-2 border-[#166534] bg-[#052e16] px-5 py-2 text-sm text-[#4ade80]">I was correct</button>
                                                                    <button onClick={() => setProgress(prev => ({ ...prev, [q.id]: { ...prev[q.id], graded: true, correct: false } }))} className="rounded-lg border-2 border-[#991b1b] bg-[#450a0a] px-5 py-2 text-sm text-[#f87171]">I was incorrect</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="mt-5 flex gap-3">
                                                <button onClick={() => { setQIdx(i => Math.max(i - 1, 0)); setShowAnswer(false); }} disabled={qIdx === 0} className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] disabled:opacity-50">Prev</button>
                                                <button onClick={() => { if (qIdx >= exam.questions.length - 1) setFinished(true); else { setQIdx(i => i + 1); setShowAnswer(false); } }} disabled={!p.graded} className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] disabled:opacity-50">{qIdx === exam.questions.length - 1 ? "Finish" : "Next"}</button>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </AnimatedPanel>
                    )}

                    {/* Exam finished screen */}
                    {active === "exam" && finished && exam && (
                        <AnimatedPanel activeKey="exam-finished">
                            <div className="rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-8 shadow-md">
                                <h2 className="text-2xl font-bold text-white mb-4">Results</h2>
                                {(() => {
                                    let correct = 0, total = 0;
                                    for (const q of exam.questions) {
                                        const p = progress[q.id];
                                        if (p?.graded) { total++; if (p.correct) correct++; }
                                    }
                                    const percent = total ? Math.round((correct / total) * 100) : 0;
                                    return (
                                        <>
                                            <p className="text-[#D4D4D4]">Score: <span className="font-semibold">{correct}</span> / <span className="font-semibold">{total}</span> ({percent}%)</p>
                                            <div className="mt-4 flex gap-3">
                                                <button onClick={() => { setProgress({}); setQIdx(0); setShowAnswer(false); setFinished(false); }} className="rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-6 py-2.5 text-sm font-medium text-white">Retake</button>
                                                <button onClick={() => setFinished(false)} className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4]">Review</button>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </AnimatedPanel>
                    )}
                </div>
            );
        }

        // Edit mode
        return (
            <div className="mt-6 space-y-8">
                {/* Mode toggle and Save All */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            className="rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-5 py-2.5 text-sm font-medium text-white ring-2 ring-[#A855F7] ring-offset-2 ring-offset-black"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => setManualMode("study")}
                            className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all"
                        >
                            Study
                        </button>
                    </div>
                    <button
                        onClick={saveAll}
                        disabled={saving}
                        className="rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-6 py-2.5 text-sm font-medium text-white hover:from-[#581C87] hover:to-[#9333EA] transition-all disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save All"}
                    </button>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                {/* Summary Section */}
                <div className="rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-8 shadow-md">
                    <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#404040]">
                        <h2 className="text-2xl font-bold text-white">Summary</h2>
                        {summary && !isEditingSummary && (
                            <button
                                onClick={() => {
                                    setEditedSummary(summary);
                                    setIsEditingSummary(true);
                                }}
                                className="rounded-lg border-2 border-[#404040] px-4 py-2 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all duration-200"
                            >
                                Edit
                            </button>
                        )}
                    </div>
                    {isEditingSummary || !summary ? (
                        <div>
                            <textarea
                                value={isEditingSummary ? editedSummary : editedSummary}
                                onChange={(e) => setEditedSummary(e.target.value)}
                                placeholder="Write your summary notes here... (Markdown supported)"
                                className="w-full h-64 rounded-lg border-2 border-[#404040] bg-[#0A0A0A] text-white p-4 text-sm font-mono focus:border-[#A855F7] focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black transition-all placeholder:text-[#737373]"
                            />
                            <div className="mt-4 flex gap-3">
                                <button
                                    onClick={async () => {
                                        if (!editedSummary.trim()) return;
                                        setSaving(true);
                                        setError(null);
                                        try {
                                            const res = await fetch(`/api/decks/${deckId}/content`, {
                                                method: "PATCH",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ type: "summary", content: editedSummary }),
                                            });
                                            if (!res.ok) {
                                                const data = await res.json();
                                                throw new Error(data.error || "Failed to save");
                                            }
                                            setSummary(editedSummary);
                                            setIsEditingSummary(false);
                                        } catch (e: unknown) {
                                            const message = e instanceof Error ? e.message : "Failed to save summary";
                                            setError(message);
                                        } finally {
                                            setSaving(false);
                                        }
                                    }}
                                    disabled={saving || !editedSummary.trim()}
                                    className="rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-6 py-2.5 text-sm font-medium text-white hover:from-[#581C87] hover:to-[#9333EA] transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save Summary"}
                                </button>
                                {isEditingSummary && (
                                    <button
                                        onClick={() => {
                                            setIsEditingSummary(false);
                                            setEditedSummary("");
                                        }}
                                        disabled={saving}
                                        className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all duration-200 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <MarkdownRenderer content={summary} />
                    )}
                </div>

                {/* Flashcards Section */}
                <div className="rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-8 shadow-md">
                    <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#404040]">
                        <h2 className="text-2xl font-bold text-white">Flashcards</h2>
                        {flashcards && flashcards.length > 0 && (
                            <div className="text-sm text-[#A3A3A3] font-medium">
                                {flashcards.length} card{flashcards.length !== 1 ? "s" : ""}
                            </div>
                        )}
                    </div>

                    {/* Existing flashcards list */}
                    {flashcards && flashcards.length > 0 && (
                        <div className="space-y-3 mb-6">
                            {flashcards.map((card, i) => (
                                <div
                                    key={i}
                                    className="rounded-lg border border-[#404040] bg-[#0A0A0A] p-4"
                                >
                                    {editingCardIdx === i ? (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Question</label>
                                                <textarea
                                                    value={editedQuestion}
                                                    onChange={(e) => setEditedQuestion(e.target.value)}
                                                    className="w-full h-20 rounded-lg border-2 border-[#404040] bg-[#121212] text-white p-2 text-sm focus:border-[#A855F7] focus:outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Answer</label>
                                                <textarea
                                                    value={editedAnswer}
                                                    onChange={(e) => setEditedAnswer(e.target.value)}
                                                    className="w-full h-20 rounded-lg border-2 border-[#404040] bg-[#121212] text-white p-2 text-sm focus:border-[#A855F7] focus:outline-none transition-all"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={async () => {
                                                        if (!flashcards) return;
                                                        setSaving(true);
                                                        setError(null);
                                                        try {
                                                            const updated = [...flashcards];
                                                            updated[i] = { ...updated[i], q: editedQuestion, a: editedAnswer };
                                                            const res = await fetch(`/api/decks/${deckId}/content`, {
                                                                method: "PATCH",
                                                                headers: { "Content-Type": "application/json" },
                                                                body: JSON.stringify({ type: "flashcards", content: updated }),
                                                            });
                                                            if (!res.ok) throw new Error("Failed to save");
                                                            setFlashcards(updated);
                                                            setEditingCardIdx(null);
                                                            setIsNewCard(false);
                                                        } catch (e: unknown) {
                                                            const message = e instanceof Error ? e.message : "Failed to save";
                                                            setError(message);
                                                        } finally {
                                                            setSaving(false);
                                                        }
                                                    }}
                                                    disabled={saving}
                                                    className="rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
                                                >
                                                    {saving ? "Saving..." : "Save"}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (isNewCard) {
                                                            setFlashcards(flashcards.slice(0, -1));
                                                        }
                                                        setEditingCardIdx(null);
                                                        setIsNewCard(false);
                                                    }}
                                                    disabled={saving}
                                                    className="rounded-lg border border-[#404040] px-4 py-2 text-xs font-medium text-[#D4D4D4] hover:bg-[#1A1A1A] disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-white mb-1">{card.q || "(No question)"}</div>
                                                <div className="text-sm text-[#A3A3A3] truncate">{card.a || "(No answer)"}</div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setEditedQuestion(card.q);
                                                    setEditedAnswer(card.a);
                                                    setEditingCardIdx(i);
                                                }}
                                                className="text-xs text-[#A3A3A3] hover:text-white transition-colors"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add new card button */}
                    {editingCardIdx === null && (
                        <button
                            onClick={() => {
                                const newCard: Flashcard = { q: "", a: "", refs: [], difficulty: "medium" };
                                const updated = flashcards ? [...flashcards, newCard] : [newCard];
                                setFlashcards(updated);
                                setEditedQuestion("");
                                setEditedAnswer("");
                                setEditingCardIdx(updated.length - 1);
                                setIsNewCard(true);
                            }}
                            className="w-full rounded-lg border-2 border-dashed border-[#404040] px-4 py-4 text-sm font-medium text-[#A3A3A3] hover:border-[#A855F7] hover:text-white transition-all"
                        >
                            + Add Flashcard
                        </button>
                    )}
                </div>

                {/* Practice Exam Section */}
                <div className="rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-8 shadow-md">
                    <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#404040]">
                        <h2 className="text-2xl font-bold text-white">Practice Exam</h2>
                        {exam?.questions && exam.questions.length > 0 && (
                            <div className="text-sm text-[#A3A3A3] font-medium">
                                {exam.questions.length} question{exam.questions.length !== 1 ? "s" : ""}
                            </div>
                        )}
                    </div>

                    {/* Existing questions list */}
                    {exam?.questions && exam.questions.length > 0 && (
                        <div className="space-y-3 mb-6">
                            {exam.questions.map((q, i) => (
                                <div
                                    key={q.id}
                                    className="rounded-lg border border-[#404040] bg-[#0A0A0A] p-4"
                                >
                                    {editingExamIdx === i ? (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Question</label>
                                                <textarea
                                                    value={editedExamQuestion}
                                                    onChange={(e) => setEditedExamQuestion(e.target.value)}
                                                    className="w-full h-20 rounded-lg border-2 border-[#404040] bg-[#121212] text-white p-2 text-sm focus:border-[#A855F7] focus:outline-none transition-all"
                                                />
                                            </div>
                                            {/* Choices for MCQ */}
                                            {q.type === "mcq" && (
                                                <div>
                                                    <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Choices</label>
                                                    <div className="space-y-2">
                                                        {editedExamChoices.map((choice, choiceIdx) => (
                                                            <div key={choiceIdx} className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={choice}
                                                                    onChange={(e) => {
                                                                        const updated = [...editedExamChoices];
                                                                        updated[choiceIdx] = e.target.value;
                                                                        setEditedExamChoices(updated);
                                                                    }}
                                                                    className="flex-1 rounded-lg border-2 border-[#404040] bg-[#121212] text-white p-2 text-sm focus:border-[#A855F7] focus:outline-none transition-all"
                                                                    placeholder={`Choice ${String.fromCharCode(65 + choiceIdx)}`}
                                                                />
                                                                {editedExamChoices.length > 2 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const updated = editedExamChoices.filter((_, idx) => idx !== choiceIdx);
                                                                            setEditedExamChoices(updated);
                                                                            // Adjust answer if it's now out of range
                                                                            const maxLetter = String.fromCharCode(64 + updated.length);
                                                                            if (editedExamAnswer > maxLetter) {
                                                                                setEditedExamAnswer("A");
                                                                            }
                                                                        }}
                                                                        className="px-3 py-2 text-red-400 hover:text-red-300 rounded-lg border border-[#404040] hover:border-red-500/30"
                                                                    >
                                                                        -
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {editedExamChoices.length < 6 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const nextLetter = String.fromCharCode(65 + editedExamChoices.length);
                                                                    setEditedExamChoices([...editedExamChoices, `${nextLetter}) `]);
                                                                }}
                                                                className="text-sm text-[#A855F7] hover:text-[#C084FC] transition-colors"
                                                            >
                                                                + Add Choice
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Answer</label>
                                                {q.type === "mcq" ? (
                                                    <select
                                                        value={editedExamAnswer}
                                                        onChange={(e) => setEditedExamAnswer(e.target.value)}
                                                        className="w-full rounded-lg border-2 border-[#404040] bg-[#121212] text-white p-2 text-sm focus:border-[#A855F7] focus:outline-none transition-all"
                                                    >
                                                        {editedExamChoices.map((_, choiceIdx) => {
                                                            const letter = String.fromCharCode(65 + choiceIdx);
                                                            return <option key={letter} value={letter}>{letter}</option>;
                                                        })}
                                                    </select>
                                                ) : (
                                                    <textarea
                                                        value={editedExamAnswer}
                                                        onChange={(e) => setEditedExamAnswer(e.target.value)}
                                                        className="w-full h-20 rounded-lg border-2 border-[#404040] bg-[#121212] text-white p-2 text-sm focus:border-[#A855F7] focus:outline-none transition-all"
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Explanation</label>
                                                <textarea
                                                    value={editedExamExplanation}
                                                    onChange={(e) => setEditedExamExplanation(e.target.value)}
                                                    className="w-full h-16 rounded-lg border-2 border-[#404040] bg-[#121212] text-white p-2 text-sm focus:border-[#A855F7] focus:outline-none transition-all"
                                                    placeholder="Explain the correct answer..."
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={async () => {
                                                        if (!exam) return;
                                                        setSaving(true);
                                                        setError(null);
                                                        try {
                                                            const updatedQuestions = [...exam.questions];
                                                            updatedQuestions[i] = {
                                                                ...updatedQuestions[i],
                                                                question: editedExamQuestion,
                                                                answer: editedExamAnswer,
                                                                choices: q.type === "mcq" ? editedExamChoices : undefined,
                                                                explanation: editedExamExplanation,
                                                            };
                                                            const updatedExam = { ...exam, questions: updatedQuestions };
                                                            const res = await fetch(`/api/decks/${deckId}/content`, {
                                                                method: "PATCH",
                                                                headers: { "Content-Type": "application/json" },
                                                                body: JSON.stringify({ type: "exam", content: updatedExam }),
                                                            });
                                                            if (!res.ok) throw new Error("Failed to save");
                                                            setExam(updatedExam);
                                                            setEditingExamIdx(null);
                                                        } catch (e: unknown) {
                                                            const message = e instanceof Error ? e.message : "Failed to save";
                                                            setError(message);
                                                        } finally {
                                                            setSaving(false);
                                                        }
                                                    }}
                                                    disabled={saving}
                                                    className="rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
                                                >
                                                    {saving ? "Saving..." : "Save"}
                                                </button>
                                                <button
                                                    onClick={() => setEditingExamIdx(null)}
                                                    disabled={saving}
                                                    className="rounded-lg border border-[#404040] px-4 py-2 text-xs font-medium text-[#D4D4D4] hover:bg-[#1A1A1A] disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs px-2 py-0.5 rounded bg-[#1A1A1A] text-[#A3A3A3]">
                                                        {q.type === "mcq" ? "Multiple Choice" : "Short Answer"}
                                                    </span>
                                                </div>
                                                <div className="text-sm font-medium text-white mb-1">{q.question || "(No question)"}</div>
                                                <div className="text-sm text-[#A3A3A3] truncate">Answer: {q.answer || "(No answer)"}</div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setEditedExamQuestion(q.question);
                                                    setEditedExamAnswer(q.answer);
                                                    setEditedExamChoices(q.choices || []);
                                                    setEditedExamExplanation(q.explanation || "");
                                                    setEditingExamIdx(i);
                                                }}
                                                className="text-xs text-[#A3A3A3] hover:text-white transition-colors"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add new question buttons - MCQ or Short Answer */}
                    {editingExamIdx === null && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    const newQuestion: ExamQuestion = {
                                        id: `Q${(exam?.questions?.length || 0) + 1}`,
                                        type: "mcq",
                                        question: "",
                                        choices: ["A) ", "B) ", "C) ", "D) "],
                                        answer: "A",
                                        explanation: "",
                                        refs: [],
                                        difficulty: "medium",
                                    };
                                    const updatedExam: Exam = exam
                                        ? { ...exam, questions: [...exam.questions, newQuestion] }
                                        : { title: "Practice Exam", instructions: "", questions: [newQuestion] };
                                    setExam(updatedExam);
                                    setEditedExamQuestion("");
                                    setEditedExamAnswer("A");
                                    setEditedExamChoices(["A) ", "B) ", "C) ", "D) "]);
                                    setEditedExamExplanation("");
                                    setEditingExamIdx(updatedExam.questions.length - 1);
                                }}
                                className="flex-1 rounded-lg border-2 border-dashed border-[#404040] px-4 py-4 text-sm font-medium text-[#A3A3A3] hover:border-[#A855F7] hover:text-white transition-all"
                            >
                                + Multiple Choice
                            </button>
                            <button
                                onClick={() => {
                                    const newQuestion: ExamQuestion = {
                                        id: `Q${(exam?.questions?.length || 0) + 1}`,
                                        type: "short",
                                        question: "",
                                        answer: "",
                                        explanation: "",
                                        refs: [],
                                        difficulty: "medium",
                                    };
                                    const updatedExam: Exam = exam
                                        ? { ...exam, questions: [...exam.questions, newQuestion] }
                                        : { title: "Practice Exam", instructions: "", questions: [newQuestion] };
                                    setExam(updatedExam);
                                    setEditedExamQuestion("");
                                    setEditedExamAnswer("");
                                    setEditedExamChoices([]);
                                    setEditedExamExplanation("");
                                    setEditingExamIdx(updatedExam.questions.length - 1);
                                }}
                                className="flex-1 rounded-lg border-2 border-dashed border-[#404040] px-4 py-4 text-sm font-medium text-[#A3A3A3] hover:border-[#A855F7] hover:text-white transition-all"
                            >
                                + Short Answer
                            </button>
                        </div>
                    )}
                </div>

                <ShareModal
                    deckId={deckId}
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                />
            </div>
        );
    }

    // Normal mode: existing UI with generate buttons
    return (
        <div className="mt-6">
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={generateSummary}
                    disabled={loading !== null}
                    className={`rounded-lg px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black ${
                        active === "summary"
                            ? "bg-gradient-to-br from-[#6B21A8] to-[#A855F7] ring-2 ring-[#A855F7] ring-offset-2 shadow-md"
                            : "bg-gradient-to-br from-[#6B21A8] to-[#A855F7] hover:from-[#581C87] hover:to-[#9333EA] shadow-sm hover:shadow-md"
                    }`}
                >
                    {loading === "summary" ? "Generating..." : "Summary"}
                </button>

                <button
                    onClick={generateFlashcards}
                    disabled={loading !== null}
                    className={`rounded-lg px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black ${
                        active === "flashcards"
                            ? "bg-gradient-to-br from-[#6B21A8] to-[#A855F7] ring-2 ring-[#A855F7] ring-offset-2 shadow-md"
                            : "bg-gradient-to-br from-[#6B21A8] to-[#A855F7] hover:from-[#581C87] hover:to-[#9333EA] shadow-sm hover:shadow-md"
                    }`}
                >
                    {loading === "flashcards" ? "Generating..." : "Flashcards"}
                </button>

                <button
                    onClick={generateExam}
                    disabled={loading !== null}
                    className={`rounded-lg px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black ${
                        active === "exam"
                            ? "bg-gradient-to-br from-[#6B21A8] to-[#A855F7] ring-2 ring-[#A855F7] ring-offset-2 shadow-md"
                            : "bg-gradient-to-br from-[#6B21A8] to-[#A855F7] hover:from-[#581C87] hover:to-[#9333EA] shadow-sm hover:shadow-md"
                    }`}
                >
                    {loading === "exam" ? "Generating..." : "Practice Exam"}
                </button>

                <button
                    onClick={() => setIsShareOpen(true)}
                    className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black"
                    title="Share this deck"
                >
                    Share
                </button>

                {flashcards?.length ? (
                    <>
                        <button
                            onClick={shuffleCards}
                            className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black"
                            title="Shuffle flashcards"
                        >
                            Shuffle
                        </button>
                        <button
                            onClick={exportCsv}
                            className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black"
                            title="Export to CSV"
                        >
                            Export CSV
                        </button>
                    </>
                ) : null}
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            {active === "summary" && (
                loading === "summary" ? (
                    <AnimatedPanel activeKey="summary-loading">
                        <div className="mt-8 rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] shadow-md">
                            <LoadingSpinner mode="summary" />
                        </div>
                    </AnimatedPanel>
                ) : summary ? (
                    <AnimatedPanel activeKey="summary">
                        <div className="mt-8 rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-8 shadow-md">
                            <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#404040]">
                                <h2 className="text-2xl font-bold text-white">
                                    Summary
                                </h2>
                                {!isEditingSummary && (
                                    <button
                                        onClick={() => {
                                            setEditedSummary(summary);
                                            setIsEditingSummary(true);
                                        }}
                                        className="rounded-lg border-2 border-[#404040] px-4 py-2 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all duration-200"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                            {isEditingSummary ? (
                                <div>
                                    <textarea
                                        value={editedSummary}
                                        onChange={(e) => setEditedSummary(e.target.value)}
                                        className="w-full h-96 rounded-lg border-2 border-[#404040] bg-[#0A0A0A] text-white p-4 text-sm font-mono focus:border-[#A855F7] focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black transition-all placeholder:text-[#737373]"
                                    />
                                    <div className="mt-4 flex gap-3">
                                        <button
                                            onClick={async () => {
                                                setSaving(true);
                                                setError(null);
                                                try {
                                                    const res = await fetch(`/api/decks/${deckId}/content`, {
                                                        method: "PATCH",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({ type: "summary", content: editedSummary }),
                                                    });
                                                    if (!res.ok) {
                                                        const data = await res.json();
                                                        throw new Error(data.error || "Failed to save");
                                                    }
                                                    setSummary(editedSummary);
                                                    setIsEditingSummary(false);
                                                } catch (e: any) {
                                                    setError(e.message || "Failed to save summary");
                                                } finally {
                                                    setSaving(false);
                                                }
                                            }}
                                            disabled={saving}
                                            className="rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-6 py-2.5 text-sm font-medium text-white hover:from-[#581C87] hover:to-[#9333EA] transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                                        >
                                            {saving ? "Saving..." : "Save"}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditingSummary(false);
                                                setEditedSummary("");
                                            }}
                                            disabled={saving}
                                            className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all duration-200 disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <MarkdownRenderer content={summary} />
                            )}
                        </div>
                    </AnimatedPanel>
                ) : null
            )}

            {active === "flashcards" && (
                loading === "flashcards" ? (
                    <AnimatedPanel activeKey="flashcards-loading">
                        <div className="mt-8 rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] shadow-md">
                            <LoadingSpinner mode="flashcards" />
                        </div>
                    </AnimatedPanel>
                ) : flashcards?.length ? (
                    <AnimatedPanel activeKey="flashcards">
                        <div className="mt-8 rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-8 shadow-md">
                            <div className="flex items-center justify-between gap-3 mb-6 pb-3 border-b border-[#404040]">
                                <h2 className="text-2xl font-bold text-white">Flashcards</h2>
                                <div className="text-sm text-[#A3A3A3] font-medium">
                                    {idx + 1} / {flashcards.length}
                                </div>
                            </div>

                            {current && (
                                <div className="flex flex-col items-center">
                                    {editingCardIdx === idx ? (
                                        <div className="w-full max-w-md mb-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-[#A3A3A3] mb-2">Question</label>
                                                    <textarea
                                                        value={editedQuestion}
                                                        onChange={(e) => setEditedQuestion(e.target.value)}
                                                        className="w-full h-24 rounded-lg border-2 border-[#404040] bg-[#0A0A0A] text-white p-3 text-sm focus:border-[#A855F7] focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-[#A3A3A3] mb-2">Answer</label>
                                                    <textarea
                                                        value={editedAnswer}
                                                        onChange={(e) => setEditedAnswer(e.target.value)}
                                                        className="w-full h-24 rounded-lg border-2 border-[#404040] bg-[#0A0A0A] text-white p-3 text-sm focus:border-[#A855F7] focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-4 flex gap-3 justify-center">
                                                <button
                                                    onClick={async () => {
                                                        if (!flashcards) return;
                                                        setSaving(true);
                                                        setError(null);
                                                        try {
                                                            const updated = [...flashcards];
                                                            updated[idx] = { ...updated[idx], q: editedQuestion, a: editedAnswer };
                                                            const res = await fetch(`/api/decks/${deckId}/content`, {
                                                                method: "PATCH",
                                                                headers: { "Content-Type": "application/json" },
                                                                body: JSON.stringify({ type: "flashcards", content: updated }),
                                                            });
                                                            if (!res.ok) {
                                                                const data = await res.json();
                                                                throw new Error(data.error || "Failed to save");
                                                            }
                                                            setFlashcards(updated);
                                                            setEditingCardIdx(null);
                                                            setIsNewCard(false);
                                                        } catch (e: any) {
                                                            setError(e.message || "Failed to save flashcard");
                                                        } finally {
                                                            setSaving(false);
                                                        }
                                                    }}
                                                    disabled={saving}
                                                    className="rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-6 py-2.5 text-sm font-medium text-white hover:from-[#581C87] hover:to-[#9333EA] transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                                                >
                                                    {saving ? "Saving..." : "Save"}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (isNewCard && flashcards) {
                                                            // Remove the new card if canceling
                                                            const updated = flashcards.slice(0, -1);
                                                            setFlashcards(updated);
                                                            setIdx(Math.max(0, updated.length - 1));
                                                        }
                                                        setEditingCardIdx(null);
                                                        setIsNewCard(false);
                                                    }}
                                                    disabled={saving}
                                                    className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all duration-200 disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flashcard-container w-full max-w-md mb-6">
                                            <div
                                                className={`flashcard ${revealed ? 'flipped' : ''}`}
                                                onClick={() => setRevealed(!revealed)}
                                            >
                                                {/* Front of card (Question) */}
                                                <div className="flashcard-front">
                                                    <div className="text-xs text-[#A3A3A3] mb-2">
                                                        Difficulty: {current.difficulty}
                                                        {current.refs?.length ? ` • Refs: ${current.refs.join(', ')}` : ''}
                                                    </div>
                                                    <div className="text-lg font-semibold text-center flex-grow flex items-center justify-center">
                                                        {current.q}
                                                    </div>
                                                    <div className="text-xs text-[#737373] text-center mt-2">
                                                        Click to flip
                                                    </div>
                                                </div>

                                                {/* Back of card (Answer) */}
                                                <div className="flashcard-back">
                                                    <div className="text-sm font-semibold text-[#D4D4D4] mb-3 text-center">
                                                        Answer:
                                                    </div>
                                                    <div className="text-base text-center flex-grow flex items-center justify-center whitespace-pre-wrap">
                                                        {current.a}
                                                    </div>
                                                    <div className="text-xs text-[#C084FC] text-center mt-2">
                                                        Click to flip back
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            onClick={prevCard}
                                            disabled={idx === 0 || editingCardIdx !== null}
                                            className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black"
                                        >
                                            Prev
                                        </button>
                                        {editingCardIdx === null && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setEditedQuestion(current.q);
                                                        setEditedAnswer(current.a);
                                                        setEditingCardIdx(idx);
                                                    }}
                                                    className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (!flashcards) return;
                                                        const newCard: Flashcard = {
                                                            q: "",
                                                            a: "",
                                                            refs: [],
                                                            difficulty: "medium",
                                                        };
                                                        const updated = [...flashcards, newCard];
                                                        setFlashcards(updated);
                                                        setIdx(updated.length - 1);
                                                        setEditedQuestion("");
                                                        setEditedAnswer("");
                                                        setEditingCardIdx(updated.length - 1);
                                                        setIsNewCard(true);
                                                    }}
                                                    className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black"
                                                >
                                                    Add Card
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={nextCard}
                                            disabled={idx === flashcards.length - 1 || editingCardIdx !== null}
                                            className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </AnimatedPanel>
                ) : null
            )}
            {active === "exam" && (
                loading === "exam" ? (
                    <AnimatedPanel activeKey="exam-loading">
                        <div className="mt-8 rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] shadow-md">
                            <LoadingSpinner mode="exam" />
                        </div>
                    </AnimatedPanel>
                ) : exam?.questions?.length ? (
                    <AnimatedPanel activeKey="exam">
                    <div className="mt-8 rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-8 shadow-md">
                        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#404040] mb-4">
                            <h2 className="text-2xl font-bold text-white">{exam.title || "Practice Exam"}</h2>

                            {!finished ? (
                                <div className="text-sm text-[#A3A3A3] font-medium">
                                    {qIdx + 1} / {exam.questions.length}
                                </div>
                            ) : null}
                        </div>

                        {exam.instructions && !finished ? (
                            <p className="mt-2 text-sm text-[#D4D4D4]">{exam.instructions}</p>
                        ) : null}

                        {/* FINISHED SCREEN */}
                        {finished ? (
                            <div className="mt-4 rounded-lg border border-[#404040] p-6 bg-[#0A0A0A]">
                                {(() => {
                                    const { correct, total } = scoreSummary();
                                    const percent = total ? Math.round((correct / total) * 100) : 0;

                                    return (
                                        <>
                                            <h3 className="text-lg font-semibold mb-2 text-white">Results</h3>
                                            <p className="mt-2 text-sm text-[#D4D4D4]">
                                                Score: <span className="font-semibold">{correct}</span> /{" "}
                                                <span className="font-semibold">{total}</span>{" "}
                                                {total ? `(${percent}%)` : "(No graded questions yet)"}
                                            </p>

                                            <div className="mt-4 flex gap-3">
                                                <button
                                                    onClick={retakeExam}
                                                    className="rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-6 py-2.5 text-sm font-medium text-white hover:from-[#581C87] hover:to-[#9333EA] transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black"
                                                >
                                                    Retake
                                                </button>

                                                <button
                                                    onClick={() => setFinished(false)}
                                                    className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black"
                                                    title="Go back to review questions"
                                                >
                                                    Review
                                                </button>
                                            </div>

                                            <p className="mt-3 text-xs text-[#737373]">
                                                Short-answer questions are scored based on your self-marking.
                                            </p>
                                        </>
                                    );
                                })()}
                            </div>
                        ) : (
                            /* QUESTION SCREEN */
                            <div className="mt-4 rounded-lg border border-[#404040] p-4 bg-[#0A0A0A]">
                                {(() => {
                                    const q = exam.questions[Math.min(qIdx, exam.questions.length - 1)];
                                    const p = progress[q.id] || {};

                                    // For MCQ we treat q.answer like "A" / "B" / "C" / "D"
                                    const correctLetter =
                                        typeof q.answer === "string" ? q.answer.trim().toUpperCase() : "";

                                    return (
                                        <>
                                            <div className="text-sm text-[#A3A3A3]">
                                                Difficulty: <span className="font-medium">{q.difficulty}</span>
                                                {q.refs?.length ? (
                                                    <span className="ml-3">
                                                        Refs: <span className="font-medium">{q.refs.join(", ")}</span>
                                                    </span>
                                                ) : null}
                                            </div>

                                            {editingExamIdx === qIdx ? (
                                                <div className="mt-4 space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-[#A3A3A3] mb-2">Question</label>
                                                        <textarea
                                                            value={editedExamQuestion}
                                                            onChange={(e) => setEditedExamQuestion(e.target.value)}
                                                            className="w-full h-24 rounded-lg border-2 border-[#404040] bg-[#0A0A0A] text-white p-3 text-sm focus:border-[#A855F7] focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-[#A3A3A3] mb-2">Answer</label>
                                                        {q.type === "mcq" ? (
                                                            <select
                                                                value={editedExamAnswer}
                                                                onChange={(e) => setEditedExamAnswer(e.target.value)}
                                                                className="w-full rounded-lg border-2 border-[#404040] bg-[#0A0A0A] text-white p-3 text-sm focus:border-[#A855F7] focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black transition-all"
                                                            >
                                                                <option value="A">A</option>
                                                                <option value="B">B</option>
                                                                <option value="C">C</option>
                                                                <option value="D">D</option>
                                                            </select>
                                                        ) : (
                                                            <textarea
                                                                value={editedExamAnswer}
                                                                onChange={(e) => setEditedExamAnswer(e.target.value)}
                                                                className="w-full h-24 rounded-lg border-2 border-[#404040] bg-[#0A0A0A] text-white p-3 text-sm focus:border-[#A855F7] focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black transition-all"
                                                            />
                                                        )}
                                                    </div>
                                                    {q.type === "mcq" && editedExamChoices.length > 0 && (
                                                        <div>
                                                            <label className="block text-sm font-medium text-[#A3A3A3] mb-2">Choices</label>
                                                            <div className="space-y-2">
                                                                {editedExamChoices.map((choice, i) => (
                                                                    <input
                                                                        key={i}
                                                                        type="text"
                                                                        value={choice}
                                                                        onChange={(e) => {
                                                                            const updated = [...editedExamChoices];
                                                                            updated[i] = e.target.value;
                                                                            setEditedExamChoices(updated);
                                                                        }}
                                                                        className="w-full rounded-lg border-2 border-[#404040] bg-[#0A0A0A] text-white p-3 text-sm focus:border-[#A855F7] focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black transition-all"
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <label className="block text-sm font-medium text-[#A3A3A3] mb-2">Explanation</label>
                                                        <textarea
                                                            value={editedExamExplanation}
                                                            onChange={(e) => setEditedExamExplanation(e.target.value)}
                                                            className="w-full h-24 rounded-lg border-2 border-[#404040] bg-[#0A0A0A] text-white p-3 text-sm focus:border-[#A855F7] focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black transition-all"
                                                            placeholder="Explain the correct answer..."
                                                        />
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={async () => {
                                                                if (!exam) return;
                                                                setSaving(true);
                                                                setError(null);
                                                                try {
                                                                    const updatedQuestions = [...exam.questions];
                                                                    updatedQuestions[qIdx] = {
                                                                        ...updatedQuestions[qIdx],
                                                                        question: editedExamQuestion,
                                                                        answer: editedExamAnswer,
                                                                        choices: editedExamChoices.length > 0 ? editedExamChoices : updatedQuestions[qIdx].choices,
                                                                        explanation: editedExamExplanation
                                                                    };
                                                                    const updatedExam = { ...exam, questions: updatedQuestions };
                                                                    const res = await fetch(`/api/decks/${deckId}/content`, {
                                                                        method: "PATCH",
                                                                        headers: { "Content-Type": "application/json" },
                                                                        body: JSON.stringify({ type: "exam", content: updatedExam }),
                                                                    });
                                                                    if (!res.ok) {
                                                                        const data = await res.json();
                                                                        throw new Error(data.error || "Failed to save");
                                                                    }
                                                                    setExam(updatedExam);
                                                                    setEditingExamIdx(null);
                                                                } catch (e: any) {
                                                                    setError(e.message || "Failed to save question");
                                                                } finally {
                                                                    setSaving(false);
                                                                }
                                                            }}
                                                            disabled={saving}
                                                            className="rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-6 py-2.5 text-sm font-medium text-white hover:from-[#581C87] hover:to-[#9333EA] transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                                                        >
                                                            {saving ? "Saving..." : "Save"}
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingExamIdx(null)}
                                                            disabled={saving}
                                                            className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all duration-200 disabled:opacity-50"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="mt-3 text-base font-semibold text-white">
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
                                                                            ? "bg-[#052e16] border-2 border-[#166534] text-[#4ade80]"
                                                                            : selected
                                                                            ? "bg-[#450a0a] border-2 border-[#991b1b] text-[#f87171]"
                                                                            : "border-2 border-[#404040] opacity-60 text-[#737373]"
                                                                        : "border-2 border-[#404040] hover:border-[#525252] hover:bg-[#1A1A1A] text-[#D4D4D4]"
                                                                }`}
                                                                aria-pressed={selected}
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <span className="font-medium">{choice}</span>

                                                                    {answered ? (
                                                                        isCorrectChoice ? (
                                                                            <span className="text-xs font-semibold text-[#4ade80]">Correct</span>
                                                                        ) : selected ? (
                                                                            <span className="text-xs font-semibold text-[#f87171]">Incorrect</span>
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
                                                                ? "bg-[#052e16] border-[#166534] text-[#4ade80]"
                                                                : "bg-[#450a0a] border-[#991b1b] text-[#f87171]"
                                                        }`}>
                                                            <div className={`font-semibold text-base ${
                                                                p.correct ? "text-[#4ade80]" : "text-[#f87171]"
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
                                                        className="w-full rounded-lg border-2 border-[#404040] bg-[#0A0A0A] text-white p-3 text-sm focus:border-[#A855F7] focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black transition-all placeholder:text-[#737373]"
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
                                                                className="rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-6 py-2.5 text-sm font-medium text-white hover:from-[#581C87] hover:to-[#9333EA] transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black"
                                                            >
                                                                Enter
                                                            </button>
                                                        </div>
                                                    ) : null}

                                                    {/* Revealed answer + grading */}
                                                    {showAnswer ? (
                                                        <div className="mt-4 rounded-lg border-2 border-[#404040] bg-[#121212] p-4 text-sm whitespace-pre-wrap text-[#D4D4D4]">
                                                            <div className="font-semibold text-base text-white">Correct answer:</div>
                                                            <div className="mt-1">{q.answer}</div>

                                                            {q.explanation ? (
                                                                <>
                                                                    <div className="mt-3 font-semibold text-white">Explanation:</div>
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
                                                                        className="rounded-lg border-2 border-[#166534] bg-[#052e16] px-5 py-2.5 text-sm text-[#4ade80] hover:bg-[#14532d] hover:border-[#16a34a] transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#4ade80] focus:ring-offset-2 focus:ring-offset-black"
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
                                                                        className="rounded-lg border-2 border-[#991b1b] bg-[#450a0a] px-5 py-2.5 text-sm text-[#f87171] hover:bg-[#7f1d1d] hover:border-[#dc2626] transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#f87171] focus:ring-offset-2 focus:ring-offset-black"
                                                                    >
                                                                        I was incorrect
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className={`mt-3 text-sm font-medium ${
                                                                    p.correct ? "text-[#4ade80]" : "text-[#f87171]"
                                                                }`}>
                                                                    Marked as: {p.correct ? "Correct" : "Incorrect"}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                                </>
                                            )}

                                            {/* Navigation */}
                                            <div className="mt-5 flex gap-3">
                                                <button
                                                    onClick={() => {
                                                        setQIdx((i) => Math.max(i - 1, 0));
                                                        setShowAnswer(false);
                                                        setEditingExamIdx(null);
                                                    }}
                                                    disabled={qIdx === 0 || editingExamIdx !== null}
                                                    className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black"
                                                >
                                                    Prev
                                                </button>

                                                {editingExamIdx === null && (
                                                    <button
                                                        onClick={() => {
                                                            setEditedExamQuestion(q.question);
                                                            setEditedExamAnswer(q.answer);
                                                            setEditedExamChoices(q.choices || []);
                                                            setEditedExamExplanation(q.explanation || "");
                                                            setEditingExamIdx(qIdx);
                                                        }}
                                                        className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black"
                                                    >
                                                        Edit
                                                    </button>
                                                )}

                                                <button
                                                    onClick={goNextQuestion}
                                                    disabled={!canAdvanceCurrent() || editingExamIdx !== null}
                                                    className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black"
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
                ) : null
            )}

            <ShareModal
                deckId={deckId}
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
            />
        </div>
    );
}
