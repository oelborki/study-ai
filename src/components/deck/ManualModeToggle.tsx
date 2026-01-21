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
                        ? "rounded-lg bg-gradient-to-br from-[#0891B2] to-[#06B6D4] px-5 py-2.5 text-sm font-medium text-white ring-2 ring-[#06B6D4] ring-offset-2 ring-offset-black"
                        : "rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all"
                    }
                >
                    Edit
                </button>
                <button
                    onClick={() => setMode("study")}
                    className={mode === "study"
                        ? "rounded-lg bg-gradient-to-br from-[#0891B2] to-[#06B6D4] px-5 py-2.5 text-sm font-medium text-white ring-2 ring-[#06B6D4] ring-offset-2 ring-offset-black"
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
                    className="rounded-lg bg-gradient-to-br from-[#0891B2] to-[#06B6D4] px-6 py-2.5 text-sm font-medium text-white hover:from-[#0E7490] hover:to-[#22D3EE] transition-all disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Save All"}
                </button>
            )}
        </div>
    );
}
