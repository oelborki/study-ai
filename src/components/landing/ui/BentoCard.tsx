"use client";

import { ReactNode } from "react";

type BentoVariant = "hero" | "default" | "wide";

interface BentoCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  variant?: BentoVariant;
  className?: string;
}

export function BentoCard({
  title,
  description,
  icon,
  variant = "default",
  className = "",
}: BentoCardProps) {
  const variantStyles: Record<BentoVariant, string> = {
    hero: "bento-card clay-hero p-8 md:p-10",
    default: "bento-card clay-modern p-6",
    wide: "bento-card clay-modern p-6",
  };

  return (
    <div className={`${variantStyles[variant]} h-full ${className}`}>
      <div className="relative z-10 h-full flex flex-col">
        {/* Icon container */}
        <div
          className={`
            flex items-center justify-center rounded-xl mb-4
            ${variant === "hero"
              ? "w-14 h-14 bg-gradient-to-br from-[#06B6D4]/20 to-[#06B6D4]/5"
              : "w-12 h-12 bg-[#06B6D4]/10"
            }
          `}
        >
          <span className="bento-icon">{icon}</span>
        </div>

        {/* Content */}
        <h3
          className={`
            font-semibold text-[#F8FAFC] mb-2
            ${variant === "hero" ? "text-xl md:text-2xl" : "text-lg"}
          `}
        >
          {title}
        </h3>
        <p
          className={`
            text-[#94A3B8] leading-relaxed flex-1
            ${variant === "hero" ? "text-base" : "text-sm"}
          `}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
