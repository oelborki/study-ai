"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardActions() {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCreate() {
    if (!title.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/decks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create deck");
      }

      if (data.id) {
        router.push(`/deck/${data.id}`);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create deck";
      setError(message);
      setCreating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && title.trim() && !creating) {
      handleCreate();
    }
  }

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={() => {
            setShowModal(true);
            setTitle("");
            setError(null);
          }}
          className="rounded-lg border-2 border-[#404040] px-5 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all duration-200"
        >
          Create Deck
        </button>
        <Link
          href="/upload"
          className="rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-5 py-2.5 text-sm font-medium text-white hover:from-[#581C87] hover:to-[#9333EA] transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Upload New Deck
        </Link>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[#404040] bg-[#0A0A0A] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Create New Deck</h3>
            </div>

            <p className="text-[#A3A3A3] mb-4">
              Enter a title for your new deck. You can add summaries, flashcards, and practice exams after creation.
            </p>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter deck title..."
              autoFocus
              className="w-full rounded-lg border-2 border-[#404040] bg-[#121212] px-4 py-3 text-white placeholder:text-[#737373] focus:border-[#A855F7] focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:ring-offset-2 focus:ring-offset-[#0A0A0A] transition-all"
            />

            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={creating}
                className="flex-1 rounded-lg border-2 border-[#404040] px-4 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !title.trim()}
                className="flex-1 rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-4 py-2.5 text-sm font-medium text-white hover:from-[#581C87] hover:to-[#9333EA] transition-all disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
