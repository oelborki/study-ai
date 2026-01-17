"use client";

import { useState, useMemo } from "react";
import AnimatedPanel from "@/components/ui/AnimatedPanel";
import { Flashcard } from "./types";

interface FlashcardViewerProps {
    flashcards: Flashcard[];
}

export default function FlashcardViewer({ flashcards }: FlashcardViewerProps) {
    const [idx, setIdx] = useState(0);
    const [revealed, setRevealed] = useState(false);

    const current = useMemo(() => {
        if (!flashcards?.length) return null;
        return flashcards[Math.min(idx, flashcards.length - 1)];
    }, [flashcards, idx]);

    if (!current) return null;

    return (
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
                        <button
                            onClick={() => { setIdx(i => Math.max(i - 1, 0)); setRevealed(false); }}
                            disabled={idx === 0}
                            className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <button
                            onClick={() => { setIdx(i => Math.min(i + 1, flashcards.length - 1)); setRevealed(false); }}
                            disabled={idx === flashcards.length - 1}
                            className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </AnimatedPanel>
    );
}
