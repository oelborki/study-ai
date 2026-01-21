"use client";

import { useEffect, useState } from "react";

type Phase = "upload" | "processing" | "results";

export function DemoAnimation() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [cycleKey, setCycleKey] = useState(0);

  useEffect(() => {
    const cycleDuration = 10000; // 10 seconds per cycle
    const phaseTimings = {
      upload: 2000,
      processing: 2000,
      results: 6000,
    };

    let timeouts: NodeJS.Timeout[] = [];

    const startCycle = () => {
      setPhase("upload");
      setCycleKey((k) => k + 1);

      timeouts.push(
        setTimeout(() => setPhase("processing"), phaseTimings.upload)
      );
      timeouts.push(
        setTimeout(
          () => setPhase("results"),
          phaseTimings.upload + phaseTimings.processing
        )
      );
      timeouts.push(setTimeout(startCycle, cycleDuration));
    };

    startCycle();

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Clay frame - browser/app window look */}
      <div className="clay-strong overflow-hidden">
        {/* Window header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-xs text-[#94A3B8]">Study AI</span>
          </div>
        </div>

        {/* Content area */}
        <div className="relative h-[320px] md:h-[380px] p-6 overflow-hidden">
          {/* Upload Phase */}
          <div
            key={`upload-${cycleKey}`}
            className={`absolute inset-6 flex flex-col items-center justify-center transition-all duration-500 ${
              phase === "upload"
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-4 pointer-events-none"
            }`}
          >
            <div className="clay rounded-xl p-8 w-full max-w-md text-center">
              {/* Document icon dropping animation */}
              <div className="mb-4 animate-scale-in">
                <svg
                  className="w-16 h-16 mx-auto text-[#06B6D4]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-[#F8FAFC] font-medium mb-4">
                Uploading document...
              </p>
              {/* Progress bar */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#06B6D4] to-[#22D3EE] rounded-full animate-progress"
                  style={{ animationDuration: "1.5s" }}
                />
              </div>
            </div>
          </div>

          {/* Processing Phase */}
          <div
            key={`processing-${cycleKey}`}
            className={`absolute inset-6 flex flex-col items-center justify-center transition-all duration-500 ${
              phase === "processing"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            <div className="clay rounded-xl p-8 w-full max-w-md text-center">
              {/* AI processing indicator */}
              <div className="mb-4">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#06B6D4] animate-spin-smooth" />
                  <div className="absolute inset-3 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-[#06B6D4] animate-pulse-slow"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="text-[#F8FAFC] font-medium">
                AI is analyzing your content...
              </p>
              <p className="text-sm text-[#94A3B8] mt-2">
                Generating study materials
              </p>
            </div>
          </div>

          {/* Results Phase */}
          <div
            key={`results-${cycleKey}`}
            className={`absolute inset-6 transition-all duration-500 ${
              phase === "results"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
              {/* Summary Card */}
              <div
                className="clay rounded-xl p-4 flex flex-col animate-slide-in-left"
                style={{ animationDelay: "0ms" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/20 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-[#06B6D4]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-[#F8FAFC]">
                    Summary
                  </span>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-2 bg-white/10 rounded w-full" />
                  <div className="h-2 bg-white/10 rounded w-5/6" />
                  <div className="h-2 bg-white/10 rounded w-4/6" />
                </div>
              </div>

              {/* Flashcard */}
              <div
                className="clay rounded-xl p-4 flex flex-col animate-scale-in"
                style={{ animationDelay: "150ms" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/20 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-[#06B6D4]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-[#F8FAFC]">
                    Flashcard
                  </span>
                </div>
                <div className="flex-1 flex flex-col justify-center text-center">
                  <p className="text-xs text-[#94A3B8] mb-1">Question:</p>
                  <p className="text-sm text-[#F8FAFC]">
                    What is photosynthesis?
                  </p>
                </div>
              </div>

              {/* Exam Question */}
              <div
                className="clay rounded-xl p-4 flex flex-col animate-slide-in-right"
                style={{ animationDelay: "300ms" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/20 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-[#06B6D4]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-[#F8FAFC]">
                    Exam
                  </span>
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 p-1.5 rounded bg-white/5 text-xs text-[#94A3B8]">
                    <span className="w-4 h-4 rounded border border-white/20 flex-shrink-0" />
                    Option A
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded bg-[#06B6D4]/20 border border-[#06B6D4]/40 text-xs text-[#06B6D4]">
                    <span className="w-4 h-4 rounded border-2 border-[#06B6D4] flex-shrink-0 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-sm bg-[#06B6D4]" />
                    </span>
                    Correct
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded bg-white/5 text-xs text-[#94A3B8]">
                    <span className="w-4 h-4 rounded border border-white/20 flex-shrink-0" />
                    Option C
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
