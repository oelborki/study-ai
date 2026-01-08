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
        <div className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-br from-[#6B21A8] to-[#A855F7] spinner-ring" />
        {/* Inner circle for ring effect */}
        <div className="absolute inset-2 rounded-full bg-[#0A0A0A]" />
      </div>

      {/* Loading text */}
      <p className="mt-6 text-base font-medium text-[#A855F7]">
        {modeText[mode]}...
      </p>
    </div>
  );
}
