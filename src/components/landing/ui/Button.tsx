"use client";

import Link from "next/link";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "clay-dark";
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function Button({
  href,
  children,
  variant = "primary",
  onClick,
}: ButtonProps) {
  if (variant === "primary") {
    return (
      <Link
        href={href}
        onClick={onClick}
        className="btn-clay inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold"
      >
        {children}
      </Link>
    );
  }

  if (variant === "clay-dark") {
    return (
      <Link
        href={href}
        onClick={onClick}
        className="btn-clay-dark inline-flex items-center justify-center px-8 py-3.5 text-base font-medium"
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className="btn-clay-dark inline-flex items-center justify-center px-8 py-3.5 text-base font-medium"
    >
      {children}
    </Link>
  );
}
