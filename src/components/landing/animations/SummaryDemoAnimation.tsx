"use client";

import { useEffect, useState } from "react";

const bulletPoints = [
  "Key concepts extracted",
  "Main ideas summarized",
  "Important terms highlighted",
];

export function SummaryDemoAnimation() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const runAnimation = () => {
      setVisibleLines(0);
      setCurrentText("");
      setLineIndex(0);
    };

    runAnimation();
    const interval = setInterval(runAnimation, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lineIndex >= bulletPoints.length) return;

    const text = bulletPoints[lineIndex];
    let charIndex = 0;

    const typeInterval = setInterval(() => {
      if (charIndex <= text.length) {
        setCurrentText(text.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setVisibleLines((prev) => prev + 1);
        setCurrentText("");
        setTimeout(() => setLineIndex((prev) => prev + 1), 300);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, [lineIndex]);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-[180px] space-y-2">
        {bulletPoints.slice(0, visibleLines).map((point, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs animate-fade-in">
            <span className="text-[#A855F7] mt-0.5">*</span>
            <span className="text-[#D4D4D4]">{point}</span>
          </div>
        ))}

        {lineIndex < bulletPoints.length && (
          <div className="flex items-start gap-2 text-xs">
            <span className="text-[#A855F7] mt-0.5">*</span>
            <span className="text-[#D4D4D4]">
              {currentText}
              <span className="animate-cursor text-[#A855F7]">|</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
