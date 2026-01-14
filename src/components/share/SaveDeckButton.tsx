"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface SaveDeckButtonProps {
  shareCode: string;
}

export default function SaveDeckButton({ shareCode }: SaveDeckButtonProps) {
  const [saving, setSaving] = useState(false);
  const [savedDeckId, setSavedDeckId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { status } = useSession();
  const router = useRouter();

  async function handleSave() {
    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=/share/${shareCode}`);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/decks/save-shared", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save deck");
        return;
      }

      setSavedDeckId(data.deckId);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (savedDeckId) {
    return (
      <Link
        href={`/deck/${savedDeckId}`}
        className="inline-flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2 text-sm text-green-400 font-medium hover:bg-green-500/20 transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>Saved - View in My Decks</span>
      </Link>
    );
  }

  return (
    <>
      <button
        onClick={handleSave}
        disabled={saving || status === "loading"}
        className="inline-flex items-center gap-2 rounded-lg border-2 border-[#404040] px-4 py-2 text-sm font-medium text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? (
          <>
            <div className="w-4 h-4 border-2 border-[#737373] border-t-[#D4D4D4] rounded-full animate-spin" />
            <span>Loading...</span>
          </>
        ) : saving ? (
          <>
            <div className="w-4 h-4 border-2 border-[#737373] border-t-[#D4D4D4] rounded-full animate-spin" />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span>{status !== "authenticated" ? "Sign in to Save" : "Save to My Decks"}</span>
          </>
        )}
      </button>
      {error && <span className="ml-3 text-sm text-red-400">{error}</span>}
    </>
  );
}
