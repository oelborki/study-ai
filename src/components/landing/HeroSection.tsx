"use client";

import { GlowButton } from "./ui/GlowButton";

export function HeroSection() {
  const handleScrollToDemo = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="mx-auto mt-16 md:mt-24 lg:mt-32 max-w-4xl text-center">
      <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-white animate-hero-1">
        Turn lecture materials into a study session in seconds.
      </h1>

      <p className="mt-6 text-xl md:text-2xl max-w-2xl mx-auto text-[#D4D4D4] animate-hero-2">
        Upload documents, generate AI summaries, create flashcards and practice exams,
        build manual decks, and collaborate with your team.
      </p>

      <div className="mt-10 md:mt-12 flex flex-col sm:flex-row justify-center gap-4 animate-hero-3">
        <GlowButton href="/register" variant="primary">
          Get Started Free
        </GlowButton>
        <GlowButton href="#how-it-works" variant="secondary" onClick={handleScrollToDemo}>
          See it in action
        </GlowButton>
      </div>
    </section>
  );
}
