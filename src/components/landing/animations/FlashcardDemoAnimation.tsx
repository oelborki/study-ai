"use client";

export function FlashcardDemoAnimation() {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="flashcard-container w-full max-w-[160px]">
        <div className="relative w-full h-24 flashcard-demo" style={{ transformStyle: "preserve-3d" }}>
          {/* Front */}
          <div
            className="absolute inset-0 rounded-lg border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] flex flex-col items-center justify-center p-3"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="text-[10px] text-[#A855F7] font-medium mb-1">Question</div>
            <div className="text-xs text-white text-center">What is machine learning?</div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-lg border border-[#A855F7] bg-gradient-to-br from-[#4C1D95] to-[#6B21A8] flex flex-col items-center justify-center p-3"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="text-[10px] text-[#C084FC] font-medium mb-1">Answer</div>
            <div className="text-xs text-white text-center">A subset of AI that learns from data</div>
          </div>
        </div>
      </div>
    </div>
  );
}
