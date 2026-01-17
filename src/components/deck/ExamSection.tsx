"use client";

import { useState } from "react";
import { Exam, ExamQuestion } from "./types";

interface ExamSectionProps {
    exam: Exam | null;
    setExam: (exam: Exam) => void;
    deckId: string;
    onError?: (error: string) => void;
}

export default function ExamSection({ exam, setExam, deckId, onError }: ExamSectionProps) {
    const [editingExamIdx, setEditingExamIdx] = useState<number | null>(null);
    const [editedExamQuestion, setEditedExamQuestion] = useState("");
    const [editedExamAnswer, setEditedExamAnswer] = useState("");
    const [editedExamChoices, setEditedExamChoices] = useState<string[]>([]);
    const [editedExamExplanation, setEditedExamExplanation] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleSaveQuestion(index: number) {
        if (!exam) return;
        setSaving(true);
        try {
            const q = exam.questions[index];
            const updatedQuestions = [...exam.questions];
            updatedQuestions[index] = {
                ...updatedQuestions[index],
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
            onError?.(message);
        } finally {
            setSaving(false);
        }
    }

    function handleAddMCQ() {
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
    }

    function handleAddShortAnswer() {
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
    }

    function handleRemoveChoice(choiceIdx: number) {
        const updated = editedExamChoices.filter((_, idx) => idx !== choiceIdx);
        setEditedExamChoices(updated);
        // Adjust answer if it's now out of range
        const maxLetter = String.fromCharCode(64 + updated.length);
        if (editedExamAnswer > maxLetter) {
            setEditedExamAnswer("A");
        }
    }

    function handleAddChoice() {
        const nextLetter = String.fromCharCode(65 + editedExamChoices.length);
        setEditedExamChoices([...editedExamChoices, `${nextLetter}) `]);
    }

    return (
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
                                                                onClick={() => handleRemoveChoice(choiceIdx)}
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
                                                        onClick={handleAddChoice}
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
                                            onClick={() => handleSaveQuestion(i)}
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
                        onClick={handleAddMCQ}
                        className="flex-1 rounded-lg border-2 border-dashed border-[#404040] px-4 py-4 text-sm font-medium text-[#A3A3A3] hover:border-[#A855F7] hover:text-white transition-all"
                    >
                        + Multiple Choice
                    </button>
                    <button
                        onClick={handleAddShortAnswer}
                        className="flex-1 rounded-lg border-2 border-dashed border-[#404040] px-4 py-4 text-sm font-medium text-[#A3A3A3] hover:border-[#A855F7] hover:text-white transition-all"
                    >
                        + Short Answer
                    </button>
                </div>
            )}
        </div>
    );
}
