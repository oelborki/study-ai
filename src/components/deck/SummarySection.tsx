"use client";

import { useState } from "react";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

interface SummarySectionProps {
    summary: string | null;
    setSummary: (summary: string) => void;
    deckId: string;
    onError?: (error: string) => void;
}

export default function SummarySection({ summary, setSummary, deckId, onError }: SummarySectionProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedSummary, setEditedSummary] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        if (!editedSummary.trim()) return;
        setSaving(true);
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
            setIsEditing(false);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Failed to save summary";
            onError?.(message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-8 shadow-md">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#404040]">
                <h2 className="text-2xl font-bold text-white">Summary</h2>
                {summary && !isEditing && (
                    <button
                        onClick={() => {
                            setEditedSummary(summary);
                            setIsEditing(true);
                        }}
                        className="rounded-lg border-2 border-[#404040] px-4 py-2 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all duration-200"
                    >
                        Edit
                    </button>
                )}
            </div>
            {isEditing || !summary ? (
                <div>
                    <textarea
                        value={editedSummary}
                        onChange={(e) => setEditedSummary(e.target.value)}
                        placeholder="Write your summary notes here... (Markdown supported)"
                        className="w-full h-64 rounded-lg border-2 border-[#404040] bg-[#0A0A0A] text-white p-4 text-sm font-mono focus:border-[#A855F7] focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-black transition-all placeholder:text-[#737373]"
                    />
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={saving || !editedSummary.trim()}
                            className="rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-6 py-2.5 text-sm font-medium text-white hover:from-[#581C87] hover:to-[#9333EA] transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save Summary"}
                        </button>
                        {isEditing && (
                            <button
                                onClick={() => {
                                    setIsEditing(false);
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
    );
}
