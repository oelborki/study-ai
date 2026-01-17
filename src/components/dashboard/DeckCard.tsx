"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeckCardProps {
  deck: {
    id: string;
    title: string;
    fileType: string | null;
    originalFileName: string | null;
    createdAt: Date | null;
  };
}

export default function DeckCard({ deck }: DeckCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(true);
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/decks/${deck.id}`, { method: "DELETE" });
      if (res.ok) {
        setShowModal(false);
        router.refresh();
      }
    } catch {
      // Error handling
    } finally {
      setDeleting(false);
    }
  }

  function handleCardClick() {
    if (!showModal) {
      router.push(`/deck/${deck.id}`);
    }
  }

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group relative rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-6 hover:border-[#6B21A8] transition-all duration-200 cursor-pointer"
      >
        {/* Delete button - shows on hover */}
        <button
          onClick={handleDeleteClick}
          className="absolute top-3 right-3 p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 bg-[#1A1A1A] border border-[#404040] text-[#737373] hover:text-red-400 hover:border-red-500/30"
          title="Delete deck"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
            {deck.fileType === "manual" ? (
              <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
            ) : deck.fileType === "pdf" ? (
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 15.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm0 2v16h12V4H6zm2 3h8v2H8V7zm0 4h8v2H8v-2zm0 4h5v2H8v-2z" />
              </svg>
            )}
          </div>
          <span className="text-xs text-[#737373] uppercase tracking-wider">
            {deck.fileType === "manual" ? "manual" : deck.fileType || "pptx"}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-[#A855F7] transition-colors line-clamp-2">
          {deck.title}
        </h3>

        {deck.originalFileName && (
          <p className="text-sm text-[#737373] truncate mb-3">
            {deck.originalFileName}
          </p>
        )}

        <p className="text-xs text-[#525252]">
          {deck.createdAt
            ? new Date(deck.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Unknown date"}
        </p>
      </div>

      {/* Delete confirmation modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowModal(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-[#404040] bg-[#0A0A0A] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Delete Deck</h3>
            </div>

            <p className="text-[#A3A3A3] mb-6">
              Are you sure you want to delete <span className="text-white font-medium">{deck.title}</span>? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border-2 border-[#404040] px-4 py-2.5 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
