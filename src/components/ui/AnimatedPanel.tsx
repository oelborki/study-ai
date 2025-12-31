import React from "react";

export default function AnimatedPanel({
  activeKey,
  children,
  className = "",
}: {
  activeKey: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      key={activeKey}
      className={`mt-6 animate-panel ${className}`}
    >
      {children}
    </div>
  );
}