"use client";

interface ManualModeToggleProps {
    mode: "edit" | "study";
    setMode: (mode: "edit" | "study") => void;
    onSaveAll?: () => void;
    saving?: boolean;
}

export default function ManualModeToggle({ mode, setMode, onSaveAll, saving }: ManualModeToggleProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
                <button
                    onClick={() => setMode("edit")}
                    className={mode === "edit"
                        ? "rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-5 py-2.5 text-sm font-medium text-white ring-2 ring-[#A855F7] ring-offset-2 ring-offset-black"
                        : "rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all"
                    }
                >
                    Edit
                </button>
                <button
                    onClick={() => setMode("study")}
                    className={mode === "study"
                        ? "rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-5 py-2.5 text-sm font-medium text-white ring-2 ring-[#A855F7] ring-offset-2 ring-offset-black"
                        : "rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all"
                    }
                >
                    Study
                </button>
            </div>
            {mode === "edit" && onSaveAll && (
                <button
                    onClick={onSaveAll}
                    disabled={saving}
                    className="rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-6 py-2.5 text-sm font-medium text-white hover:from-[#581C87] hover:to-[#9333EA] transition-all disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Save All"}
                </button>
            )}
        </div>
    );
}
