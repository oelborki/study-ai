"use client";

import { useEffect, useState } from "react";

type Phase = "upload" | "processing" | "mode" | "summary" | "flashcard" | "exam";

const phases: { id: Phase; label: string; duration: number }[] = [
  { id: "upload", label: "Upload", duration: 3000 },
  { id: "processing", label: "Processing", duration: 2000 },
  { id: "mode", label: "Choose Mode", duration: 2000 },
  { id: "summary", label: "Summary", duration: 3000 },
  { id: "flashcard", label: "Flashcards", duration: 3000 },
  { id: "exam", label: "Practice Exam", duration: 3000 },
];

const modes = ["Summary", "Flashcards", "Exam"];
const summaryLines = ["Key concepts identified", "Main arguments extracted", "Important dates noted"];
const examOptions = ["Photosynthesis", "Cellular respiration", "Mitosis", "Meiosis"];

export function WorkflowAnimation() {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedMode, setSelectedMode] = useState(-1);
  const [visibleSummaryLines, setVisibleSummaryLines] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [visibleOptions, setVisibleOptions] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(-1);

  useEffect(() => {
    const phase = phases[currentPhase];

    // Phase-specific animations
    if (phase.id === "upload") {
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 5, 100));
      }, 100);
      return () => clearInterval(progressInterval);
    }

    if (phase.id === "mode") {
      setSelectedMode(-1);
      const timeout = setTimeout(() => setSelectedMode(0), 1000);
      return () => clearTimeout(timeout);
    }

    if (phase.id === "summary") {
      setVisibleSummaryLines(0);
      const interval = setInterval(() => {
        setVisibleSummaryLines((prev) => Math.min(prev + 1, 3));
      }, 800);
      return () => clearInterval(interval);
    }

    if (phase.id === "flashcard") {
      setFlipped(false);
      const timeout = setTimeout(() => setFlipped(true), 1500);
      return () => clearTimeout(timeout);
    }

    if (phase.id === "exam") {
      setVisibleOptions(0);
      setSelectedAnswer(-1);
      for (let i = 1; i <= 4; i++) {
        setTimeout(() => setVisibleOptions(i), i * 300);
      }
      setTimeout(() => setSelectedAnswer(0), 2000);
    }
  }, [currentPhase]);

  useEffect(() => {
    const phase = phases[currentPhase];
    const timeout = setTimeout(() => {
      setCurrentPhase((prev) => (prev + 1) % phases.length);
    }, phase.duration);
    return () => clearTimeout(timeout);
  }, [currentPhase]);

  const renderPhaseContent = () => {
    const phase = phases[currentPhase];

    switch (phase.id) {
      case "upload":
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-[#404040] flex items-center justify-center mb-4">
              {uploadProgress < 30 ? (
                <div className="animate-document-drop">
                  <svg className="w-10 h-12 text-[#A855F7]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                    <path fill="#6B21A8" d="M14 2v6h6" />
                  </svg>
                </div>
              ) : (
                <svg className="w-10 h-12 text-[#A855F7]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                  <path fill="#6B21A8" d="M14 2v6h6" />
                </svg>
              )}
            </div>
            <div className="w-48 h-2 bg-[#262626] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#6B21A8] to-[#A855F7] rounded-full transition-all duration-100"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-[#A3A3A3]">Uploading lecture.pdf...</p>
          </div>
        );

      case "processing":
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 rounded-full border-4 border-[#262626] border-t-[#A855F7] animate-spin-smooth" />
            <p className="mt-4 text-sm text-[#A3A3A3]">Extracting content...</p>
          </div>
        );

      case "mode":
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-sm text-[#A3A3A3] mb-4">Choose your study mode</p>
            <div className="flex gap-2">
              {modes.map((mode, idx) => (
                <button
                  key={mode}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all duration-300 animate-option ${
                    selectedMode === idx
                      ? "border-[#A855F7] bg-[#A855F7]/10 text-[#A855F7]"
                      : "border-[#404040] text-[#D4D4D4]"
                  }`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        );

      case "summary":
        return (
          <div className="flex flex-col items-start justify-center h-full px-8">
            <p className="text-sm font-medium text-white mb-3">AI Summary</p>
            <div className="space-y-2">
              {summaryLines.map((line, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 text-sm transition-opacity duration-300 ${
                    idx < visibleSummaryLines ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <span className="text-[#A855F7]">*</span>
                  <span className="text-[#D4D4D4]">{line}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "flashcard":
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="flashcard-container w-64">
              <div
                className={`relative w-full h-32 transition-transform duration-500`}
                style={{
                  transformStyle: "preserve-3d",
                  transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 rounded-lg border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] flex flex-col items-center justify-center p-4"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className="text-[10px] text-[#A855F7] mb-2">Question</span>
                  <span className="text-sm text-white text-center">What is the powerhouse of the cell?</span>
                </div>
                {/* Back */}
                <div
                  className="absolute inset-0 rounded-lg border border-[#A855F7] bg-gradient-to-br from-[#4C1D95] to-[#6B21A8] flex flex-col items-center justify-center p-4"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <span className="text-[10px] text-[#C084FC] mb-2">Answer</span>
                  <span className="text-sm text-white text-center">Mitochondria</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "exam":
        return (
          <div className="flex flex-col items-start justify-center h-full px-8">
            <p className="text-sm text-[#A3A3A3] mb-3">Which organelle produces ATP?</p>
            <div className="space-y-2 w-full max-w-xs">
              {examOptions.map((option, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-2 rounded-lg border text-sm transition-all duration-300 ${
                    idx < visibleOptions ? "opacity-100" : "opacity-0"
                  } ${
                    selectedAnswer === idx
                      ? idx === 0
                        ? "border-[#4ade80] bg-[#052e16] text-[#4ade80]"
                        : "border-[#f87171] bg-[#450a0a] text-[#f87171]"
                      : "border-[#404040] text-[#D4D4D4]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                    {selectedAnswer === idx && idx === 0 && (
                      <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Mock browser window */}
      <div className="rounded-xl border border-[#404040] bg-[#0A0A0A] overflow-hidden shadow-2xl">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#121212] border-b border-[#262626]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#f87171]" />
            <div className="w-3 h-3 rounded-full bg-[#fbbf24]" />
            <div className="w-3 h-3 rounded-full bg-[#4ade80]" />
          </div>
          <div className="flex-1 mx-4">
            <div className="px-3 py-1 rounded-md bg-[#0A0A0A] border border-[#262626] text-xs text-[#737373]">
              study-ai.app/deck
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="h-64 bg-gradient-to-br from-[#0A0A0A] to-[#000000]">
          {renderPhaseContent()}
        </div>
      </div>

      {/* Phase indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {phases.map((phase, idx) => (
          <button
            key={phase.id}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              idx === currentPhase
                ? "bg-[#A855F7] w-6"
                : idx < currentPhase
                ? "bg-[#6B21A8]"
                : "bg-[#404040]"
            }`}
            aria-label={phase.label}
          />
        ))}
      </div>
      <p className="text-center text-sm text-[#A3A3A3] mt-2">{phases[currentPhase].label}</p>
    </div>
  );
}
