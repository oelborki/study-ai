"use client";

import { useState, useEffect } from "react";

interface ShareModalProps {
  deckId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ deckId, isOpen, onClose }: ShareModalProps) {
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(true);

  const shareUrl = shareCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${shareCode}`
    : null;

  useEffect(() => {
    if (isOpen) {
      checkExistingShare();
    }
  }, [isOpen, deckId]);

  async function checkExistingShare() {
    setChecking(true);
    try {
      const res = await fetch(`/api/decks/${deckId}/share`);
      const data = await res.json();
      if (data.share?.shareCode) {
        setShareCode(data.share.shareCode);
      }
    } catch {
      // No existing share
    } finally {
      setChecking(false);
    }
  }

  async function createShareLink() {
    setLoading(true);
    try {
      const res = await fetch(`/api/decks/${deckId}/share`, { method: "POST" });
      const data = await res.json();
      if (data.shareCode) {
        setShareCode(data.shareCode);
      }
    } catch (error) {
      console.error("Failed to create share link:", error);
    } finally {
      setLoading(false);
    }
  }

  async function removeShareLink() {
    setLoading(true);
    try {
      await fetch(`/api/decks/${deckId}/share`, { method: "DELETE" });
      setShareCode(null);
    } catch (error) {
      console.error("Failed to remove share link:", error);
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#404040] bg-[#0A0A0A] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Share Deck</h2>
          <button
            onClick={onClose}
            className="text-[#737373] hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {checking ? (
          <div className="py-8 text-center">
            <div className="w-8 h-8 border-2 border-[#6B21A8] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-[#737373] mt-4">Checking share status...</p>
          </div>
        ) : !shareCode ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <p className="text-[#A3A3A3] mb-6">
              Create a public link to share this deck with anyone.
              <br />
              <span className="text-[#737373] text-sm">They&apos;ll be able to view and study with it.</span>
            </p>
            <button
              onClick={createShareLink}
              disabled={loading}
              className="rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-6 py-2.5 text-sm font-medium text-white hover:from-[#581C87] hover:to-[#9333EA] transition-all disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Share Link"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#A3A3A3] mb-2">Share URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl || ""}
                  readOnly
                  className="flex-1 rounded-lg border-2 border-[#404040] bg-[#121212] px-3 py-2.5 text-sm text-white truncate"
                />
                <button
                  onClick={copyToClipboard}
                  className="rounded-lg border-2 border-[#404040] px-4 py-2 text-sm text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all whitespace-nowrap"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#121212] border border-[#2D2D2D]">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-[#A3A3A3]">
                Anyone with this link can view and study this deck
              </p>
            </div>

            <button
              onClick={removeShareLink}
              disabled={loading}
              className="w-full rounded-lg border-2 border-[#404040] py-2 text-sm text-[#f87171] hover:bg-[#1A1A1A] transition-all disabled:opacity-50"
            >
              {loading ? "Removing..." : "Remove Share Link"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
