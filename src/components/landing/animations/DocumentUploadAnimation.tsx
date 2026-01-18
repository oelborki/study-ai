"use client";

import { useEffect, useState } from "react";

export function DocumentUploadAnimation() {
  const [phase, setPhase] = useState<"idle" | "dropping" | "progress" | "complete">("idle");

  useEffect(() => {
    const runAnimation = () => {
      setPhase("dropping");
      setTimeout(() => setPhase("progress"), 600);
      setTimeout(() => setPhase("complete"), 2100);
      setTimeout(() => setPhase("idle"), 3500);
    };

    runAnimation();
    const interval = setInterval(runAnimation, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="relative w-24 h-28 flex flex-col items-center justify-center">
        {/* Upload zone */}
        <div
          className={`w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center transition-all duration-300 ${
            phase === "complete"
              ? "border-[#4ade80] bg-[#052e16]"
              : "border-[#404040] bg-[#0A0A0A]"
          }`}
        >
          {phase === "idle" && (
            <svg className="w-8 h-8 text-[#737373]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}

          {(phase === "dropping" || phase === "progress" || phase === "complete") && (
            <div className={`${phase === "dropping" ? "animate-document-drop" : ""}`}>
              <svg className="w-10 h-12 text-[#A855F7]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                <path fill="#6B21A8" d="M14 2v6h6" />
              </svg>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {(phase === "progress" || phase === "complete") && (
          <div className="mt-2 w-20 h-1.5 bg-[#262626] rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r from-[#6B21A8] to-[#A855F7] rounded-full ${
                phase === "progress" ? "animate-progress-fill" : "w-full"
              }`}
            />
          </div>
        )}

        {phase === "complete" && (
          <svg className="absolute -top-1 -right-1 w-5 h-5 text-[#4ade80] animate-fade-in" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  );
}
