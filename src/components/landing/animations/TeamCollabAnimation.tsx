"use client";

import { useEffect, useState } from "react";

const avatarColors = ["#A855F7", "#3B82F6", "#10B981"];

export function TeamCollabAnimation() {
  const [visibleAvatars, setVisibleAvatars] = useState(0);
  const [showDeck, setShowDeck] = useState(false);

  useEffect(() => {
    const runAnimation = () => {
      setVisibleAvatars(0);
      setShowDeck(false);

      // Pop in avatars with stagger
      for (let i = 1; i <= 3; i++) {
        setTimeout(() => setVisibleAvatars(i), i * 300);
      }

      // Slide in shared deck
      setTimeout(() => setShowDeck(true), 1200);

      // Reset
      setTimeout(() => {
        setVisibleAvatars(0);
        setShowDeck(false);
      }, 3800);
    };

    runAnimation();
    const interval = setInterval(runAnimation, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-[180px]">
        {/* Avatars */}
        <div className="flex justify-center mb-3">
          <div className="flex -space-x-2">
            {avatarColors.map((color, idx) => (
              <div
                key={idx}
                className={`w-8 h-8 rounded-full border-2 border-[#0A0A0A] flex items-center justify-center text-xs text-white font-medium ${
                  idx < visibleAvatars ? "animate-avatar" : "opacity-0"
                }`}
                style={{
                  backgroundColor: color,
                  animationDelay: `${idx * 100}ms`,
                  zIndex: 3 - idx
                }}
              >
                {String.fromCharCode(65 + idx)}
              </div>
            ))}
          </div>
        </div>

        {/* Shared deck */}
        {showDeck && (
          <div className="animate-slide-right rounded-lg border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#A855F7]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              <span className="text-xs text-white">Team Study Deck</span>
            </div>
            <div className="mt-1 flex items-center gap-1">
              <div className="flex -space-x-1">
                {avatarColors.map((color, idx) => (
                  <div
                    key={idx}
                    className="w-4 h-4 rounded-full border border-[#0A0A0A]"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-[#A3A3A3] ml-1">3 members</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
