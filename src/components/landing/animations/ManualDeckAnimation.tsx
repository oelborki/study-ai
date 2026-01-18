"use client";

import { useEffect, useState } from "react";

export function ManualDeckAnimation() {
  const [phase, setPhase] = useState<"empty" | "typing" | "card">("empty");
  const [title, setTitle] = useState("");

  const fullTitle = "Biology 101";

  useEffect(() => {
    const runAnimation = () => {
      setPhase("empty");
      setTitle("");

      setTimeout(() => {
        setPhase("typing");
        let charIndex = 0;
        const typeInterval = setInterval(() => {
          if (charIndex <= fullTitle.length) {
            setTitle(fullTitle.slice(0, charIndex));
            charIndex++;
          } else {
            clearInterval(typeInterval);
            setTimeout(() => setPhase("card"), 500);
          }
        }, 80);
      }, 500);

      setTimeout(() => {
        setPhase("empty");
        setTitle("");
      }, 3800);
    };

    runAnimation();
    const interval = setInterval(runAnimation, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-[160px]">
        {phase === "empty" && (
          <div className="h-24 rounded-lg border-2 border-dashed border-[#404040] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#737373]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        )}

        {phase === "typing" && (
          <div className="space-y-2 animate-fade-in">
            <div className="text-[10px] text-[#A3A3A3]">Deck name</div>
            <div className="px-3 py-2 rounded-lg border border-[#404040] bg-[#0A0A0A]">
              <span className="text-sm text-white">{title}</span>
              <span className="animate-cursor text-[#A855F7]">|</span>
            </div>
          </div>
        )}

        {phase === "card" && (
          <div className="animate-fade-in">
            <div className="rounded-lg border border-[#A855F7] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-3">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-[#A855F7]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                <span className="text-sm text-white font-medium">{fullTitle}</span>
              </div>
              <div className="text-[10px] text-[#A3A3A3]">0 cards</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
