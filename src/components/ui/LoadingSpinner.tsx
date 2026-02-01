interface LoadingSpinnerProps {
  mode: "summary" | "flashcards" | "exam";
  size?: "md" | "lg";
}

export default function LoadingSpinner({
  mode,
  size = "md"
}: LoadingSpinnerProps) {
  const modeText = {
    summary: "Generating Summary",
    flashcards: "Generating Flashcards",
    exam: "Generating Practice Exam",
  };

  const sizeClasses = {
    md: "w-12 h-12",  // 48px
    lg: "w-16 h-16",  // 64px
  };

  return (
    <div className="flex flex-col items-center justify-center py-20">
      {/* Spinning ring container */}
      <div className={`${sizeClasses[size]} relative animate-spin-smooth`}>
        {/* Gradient ring */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent spinner-ring" style={{ background: `linear-gradient(to bottom right, var(--color-accent-hover), var(--color-accent))` }} />
        {/* Inner circle for ring effect */}
        <div className="absolute inset-2 rounded-full bg-[#0A0A0A]" />
      </div>

      {/* Loading text */}
      <p className="mt-6 text-base font-medium text-accent">
        {modeText[mode]}...
      </p>
    </div>
  );
}
