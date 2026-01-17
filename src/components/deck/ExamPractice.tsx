"use client";

import { useState } from "react";
import AnimatedPanel from "@/components/ui/AnimatedPanel";
import { Exam, ExamProgress } from "./types";

interface ExamPracticeProps {
    exam: Exam;
    onFinish?: () => void;
}

export default function ExamPractice({ exam, onFinish }: ExamPracticeProps) {
    const [qIdx, setQIdx] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [progress, setProgress] = useState<Record<string, ExamProgress>>({});
    const [finished, setFinished] = useState(false);

    if (!exam?.questions?.length) return null;

    const q = exam.questions[Math.min(qIdx, exam.questions.length - 1)];
    const p = progress[q.id] || {};
    const correctLetter = typeof q.answer === "string" ? q.answer.trim().toUpperCase() : "";

    function handleRetake() {
        setProgress({});
        setQIdx(0);
        setShowAnswer(false);
        setFinished(false);
    }

    function handleFinishOrNext() {
        if (qIdx >= exam.questions.length - 1) {
            setFinished(true);
        } else {
            setQIdx(i => i + 1);
            setShowAnswer(false);
        }
    }

    // Results screen
    if (finished) {
        let correct = 0, total = 0;
        for (const question of exam.questions) {
            const prog = progress[question.id];
            if (prog?.graded) {
                total++;
                if (prog.correct) correct++;
            }
        }
        const percent = total ? Math.round((correct / total) * 100) : 0;

        return (
            <AnimatedPanel activeKey="exam-finished">
                <div className="rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-8 shadow-md">
                    <h2 className="text-2xl font-bold text-white mb-4">Results</h2>
                    <p className="text-[#D4D4D4]">
                        Score: <span className="font-semibold">{correct}</span> / <span className="font-semibold">{total}</span> ({percent}%)
                    </p>
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={handleRetake}
                            className="rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-6 py-2.5 text-sm font-medium text-white"
                        >
                            Retake
                        </button>
                        <button
                            onClick={() => setFinished(false)}
                            className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4]"
                        >
                            Review
                        </button>
                    </div>
                </div>
            </AnimatedPanel>
        );
    }

    return (
        <AnimatedPanel activeKey="exam">
            <div className="rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-8 shadow-md">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#404040] mb-4">
                    <h2 className="text-2xl font-bold text-white">{exam.title || "Practice Exam"}</h2>
                    <div className="text-sm text-[#A3A3A3] font-medium">{qIdx + 1} / {exam.questions.length}</div>
                </div>

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
                                <button
                                    onClick={() => setShowAnswer(true)}
                                    className="mt-3 rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-6 py-2.5 text-sm font-medium text-white"
                                >
                                    Show Answer
                                </button>
                            )}
                            {showAnswer && (
                                <div className="mt-4 rounded-lg border-2 border-[#404040] bg-[#121212] p-4 text-sm text-[#D4D4D4]">
                                    <div className="font-semibold text-white">Correct answer:</div>
                                    <div className="mt-1">{q.answer}</div>
                                    {q.explanation && (
                                        <>
                                            <div className="mt-3 font-semibold text-white">Explanation:</div>
                                            <div className="mt-1">{q.explanation}</div>
                                        </>
                                    )}
                                    {!p.graded && (
                                        <div className="mt-4 flex gap-3">
                                            <button
                                                onClick={() => setProgress(prev => ({ ...prev, [q.id]: { ...prev[q.id], graded: true, correct: true } }))}
                                                className="rounded-lg border-2 border-[#166534] bg-[#052e16] px-5 py-2 text-sm text-[#4ade80]"
                                            >
                                                I was correct
                                            </button>
                                            <button
                                                onClick={() => setProgress(prev => ({ ...prev, [q.id]: { ...prev[q.id], graded: true, correct: false } }))}
                                                className="rounded-lg border-2 border-[#991b1b] bg-[#450a0a] px-5 py-2 text-sm text-[#f87171]"
                                            >
                                                I was incorrect
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-5 flex gap-3">
                        <button
                            onClick={() => { setQIdx(i => Math.max(i - 1, 0)); setShowAnswer(false); }}
                            disabled={qIdx === 0}
                            className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <button
                            onClick={handleFinishOrNext}
                            disabled={!p.graded}
                            className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] disabled:opacity-50"
                        >
                            {qIdx === exam.questions.length - 1 ? "Finish" : "Next"}
                        </button>
                    </div>
                </div>
            </div>
        </AnimatedPanel>
    );
}
