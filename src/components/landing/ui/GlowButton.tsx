"use client";

import Link from "next/link";

interface GlowButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function GlowButton({
  href,
  children,
  variant = "primary",
  onClick,
}: GlowButtonProps) {
  if (variant === "primary") {
    return (
      <Link
        href={href}
        onClick={onClick}
        className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#6B21A8] to-[#A855F7] px-8 py-3 text-lg font-semibold text-white transition-all duration-300 hover:from-[#581C87] hover:to-[#9333EA] animate-glow"
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-lg border-2 border-[#404040] px-8 py-3 text-lg font-semibold text-[#D4D4D4] transition-all duration-200 hover:border-[#525252] hover:bg-[#1A1A1A]"
    >
      {children}
    </Link>
  );
}
