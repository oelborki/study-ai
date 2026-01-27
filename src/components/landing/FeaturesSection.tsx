"use client";

import { ScrollReveal } from "./ui/ScrollReveal";
import { BentoCard } from "./ui/BentoCard";

const features = [
  {
    title: "AI-Powered Learning",
    description:
      "Upload any PowerPoint or PDF and instantly generate comprehensive summaries, interactive flashcards, and practice exams tailored to your content. Stop spending hours creating study materials and let AI do the heavy lifting so you can focus on actually learning.",
    icon: (
      <svg
        className="w-8 h-8 text-[#06B6D4]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
    variant: "hero" as const,
  },
  {
    title: "Study Your Way",
    description:
      "Create materials manually or let AI assist. Customize everything to match exactly how you learn best.",
    icon: (
      <svg
        className="w-6 h-6 text-[#06B6D4]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
        />
      </svg>
    ),
    variant: "default" as const,
  },
  {
    title: "Everything in One Place",
    description:
      "Notes, flashcards, and practice exams unified in a single platform. No more switching between apps.",
    icon: (
      <svg
        className="w-6 h-6 text-[#06B6D4]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
    variant: "default" as const,
  },
  {
    title: "Track Your Progress",
    description:
      "See how you're improving over time with detailed analytics. Know exactly what to focus on next.",
    icon: (
      <svg
        className="w-6 h-6 text-[#06B6D4]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    variant: "default" as const,
  },
  {
    title: "Smart Review",
    description:
      "Spaced repetition algorithms ensure you review at the optimal time for maximum retention.",
    icon: (
      <svg
        className="w-6 h-6 text-[#06B6D4]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    variant: "wide" as const,
  },
];

export function FeaturesSection() {
  return (
    <section className="mx-auto mt-32 md:mt-40 max-w-5xl">
      <ScrollReveal>
        <div className="text-center mb-12">
          <div className="inline-block clay-subtle rounded-full px-6 py-2 mb-6">
            <span className="text-sm font-medium text-[#06B6D4]">Features</span>
          </div>
          <h2 className="font-[family-name:var(--font-serif)] text-3xl md:text-4xl text-[#F8FAFC] mb-4">
            Why students <span className="text-[#06B6D4]">love</span> QuickyNotes
          </h2>
          <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
            Everything you need to ace your exams, all in one place
          </p>
        </div>
      </ScrollReveal>

      {/* Asymmetric Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {/* Row 1: Hero (spans 2 cols, 2 rows) + Study Your Way + Everything in One Place */}
        <ScrollReveal delay={0} className="md:col-span-2 md:row-span-2">
          <BentoCard
            title={features[0].title}
            description={features[0].description}
            icon={features[0].icon}
            variant="hero"
            className="min-h-[200px] md:min-h-full"
          />
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <BentoCard
            title={features[1].title}
            description={features[1].description}
            icon={features[1].icon}
            variant="default"
          />
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <BentoCard
            title={features[2].title}
            description={features[2].description}
            icon={features[2].icon}
            variant="default"
          />
        </ScrollReveal>

        {/* Row 2: Track Progress + Smart Review (wide) */}
        <ScrollReveal delay={200}>
          <BentoCard
            title={features[3].title}
            description={features[3].description}
            icon={features[3].icon}
            variant="default"
          />
        </ScrollReveal>

        <ScrollReveal delay={250} className="md:col-span-2">
          <BentoCard
            title={features[4].title}
            description={features[4].description}
            icon={features[4].icon}
            variant="wide"
          />
        </ScrollReveal>
      </div>
    </section>
  );
}
