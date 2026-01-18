"use client";

import { ReactNode } from "react";

interface FeatureCardProps {
  title: string;
  description: string;
  animation: ReactNode;
  delay?: number;
}

export function FeatureCard({
  title,
  description,
  animation,
  delay = 0,
}: FeatureCardProps) {
  return (
    <div
      className="rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-6 shadow-sm hover:shadow-lg hover:border-[#525252] transition-all duration-300 animate-card-stagger"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="h-40 mb-4 rounded-lg bg-[#0A0A0A] border border-[#262626] overflow-hidden flex items-center justify-center">
        {animation}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-[#A3A3A3] leading-relaxed">{description}</p>
    </div>
  );
}
