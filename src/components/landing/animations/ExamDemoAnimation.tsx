"use client";

import { useEffect, useState } from "react";

const options = ["Data structures", "Algorithms", "Machine learning", "Databases"];
const correctIndex = 2;

export function ExamDemoAnimation() {
  const [visibleOptions, setVisibleOptions] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    const runAnimation = () => {
      setVisibleOptions(0);
      setSelectedOption(null);

      // Stagger option appearance
      const showOptions = () => {
        for (let i = 1; i <= 4; i++) {
          setTimeout(() => setVisibleOptions(i), i * 200);
        }
      };

      showOptions();

      // Select correct answer after options appear
      setTimeout(() => setSelectedOption(correctIndex), 1800);

      // Reset after showing result
      setTimeout(() => {
        setVisibleOptions(0);
        setSelectedOption(null);
      }, 3800);
    };

    runAnimation();
    const interval = setInterval(runAnimation, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center p-3">
      <div className="w-full max-w-[180px] space-y-1.5">
        <div className="text-[10px] text-[#A3A3A3] mb-2">Which topic uses neural networks?</div>
        {options.map((option, idx) => (
          <div
            key={idx}
            className={`px-2 py-1.5 rounded border text-[10px] transition-all duration-300 ${
              idx < visibleOptions ? "animate-option" : "opacity-0"
            } ${
              selectedOption === idx
                ? idx === correctIndex
                  ? "border-[#4ade80] bg-[#052e16] text-[#4ade80]"
                  : "border-[#f87171] bg-[#450a0a] text-[#f87171]"
                : "border-[#404040] text-[#D4D4D4]"
            }`}
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[8px]">
                {String.fromCharCode(65 + idx)}
              </span>
              <span>{option}</span>
              {selectedOption === idx && idx === correctIndex && (
                <svg className="w-3 h-3 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
