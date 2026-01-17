"use client";

import { useState } from "react";
import { Flashcard } from "./types";

interface FlashcardsSectionProps {
    flashcards: Flashcard[] | null;
    setFlashcards: (flashcards: Flashcard[]) => void;
    deckId: string;
    onError?: (error: string) => void;
}

export default function FlashcardsSection({ flashcards, setFlashcards, deckId, onError }: FlashcardsSectionProps) {
    const [editingCardIdx, setEditingCardIdx] = useState<number | null>(null);
    const [editedQuestion, setEditedQuestion] = useState("");
    const [editedAnswer, setEditedAnswer] = useState("");
    const [isNewCard, setIsNewCard] = useState(false);
    const [saving, setSaving] = useState(false);

    async function handleSaveCard(index: number) {
        if (!flashcards) return;
        setSaving(true);
        try {
            const updated = [...flashcards];
            updated[index] = { ...updated[index], q: editedQuestion, a: editedAnswer };
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
            onError?.(message);
        } finally {
            setSaving(false);
        }
    }

    function handleAddCard() {
        const newCard: Flashcard = { q: "", a: "", refs: [], difficulty: "medium" };
        const updated = flashcards ? [...flashcards, newCard] : [newCard];
        setFlashcards(updated);
        setEditedQuestion("");
        setEditedAnswer("");
        setEditingCardIdx(updated.length - 1);
        setIsNewCard(true);
    }

    function handleCancelEdit() {
        if (isNewCard && flashcards) {
            setFlashcards(flashcards.slice(0, -1));
        }
        setEditingCardIdx(null);
        setIsNewCard(false);
    }

    return (
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
                                            onClick={() => handleSaveCard(i)}
                                            disabled={saving}
                                            className="rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
                                        >
                                            {saving ? "Saving..." : "Save"}
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
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
                    onClick={handleAddCard}
                    className="w-full rounded-lg border-2 border-dashed border-[#404040] px-4 py-4 text-sm font-medium text-[#A3A3A3] hover:border-[#A855F7] hover:text-white transition-all"
                >
                    + Add Flashcard
                </button>
            )}
        </div>
    );
}
