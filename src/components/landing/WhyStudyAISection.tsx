"use client";

const benefits = [
  {
    title: "Flexibility",
    tagline: "AI or Manual — Your Choice",
    description:
      "Create flashcards and exams with AI assistance, or build them yourself from scratch. You're in control.",
    icon: (
      <svg
        className="w-12 h-12 text-[#A855F7]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 9l4-4 4 4m0 6l-4 4-4-4"
        />
        <rect
          x="4"
          y="8"
          width="16"
          height="8"
          rx="4"
          strokeWidth={1.5}
        />
        <circle cx="8" cy="12" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Time Savings",
    tagline: "Study Smarter, Not Harder",
    description:
      "Let AI extract key concepts and generate study materials in seconds, not hours.",
    icon: (
      <svg
        className="w-12 h-12 text-[#A855F7]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 6v6l4 2"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 3l2 2M19 7l2-2"
        />
      </svg>
    ),
  },
  {
    title: "All-in-One",
    tagline: "Everything in One Place",
    description:
      "Notes, flashcards, and practice exams — all your study tools unified in a single platform.",
    icon: (
      <svg
        className="w-12 h-12 text-[#A855F7]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <rect
          x="4"
          y="4"
          width="16"
          height="5"
          rx="1"
          strokeWidth={1.5}
        />
        <rect
          x="4"
          y="10"
          width="16"
          height="5"
          rx="1"
          strokeWidth={1.5}
        />
        <rect
          x="4"
          y="16"
          width="16"
          height="5"
          rx="1"
          strokeWidth={1.5}
        />
      </svg>
    ),
  },
  {
    title: "Personalization",
    tagline: "Tailored to You",
    description:
      "Customize AI-generated content or create materials that match exactly how you learn best.",
    icon: (
      <svg
        className="w-12 h-12 text-[#A855F7]"
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
  },
];

export function WhyStudyAISection() {
  return (
    <section className="mx-auto mt-32 md:mt-40 lg:mt-48 max-w-5xl px-4">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white">
        Your Complete Study Companion
      </h2>
      <p className="text-center text-[#A3A3A3] mb-12 max-w-2xl mx-auto">
        Whether you prefer AI-powered automation or hands-on creation, Study AI
        adapts to your learning style.
      </p>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {benefits.map((benefit, idx) => (
          <div
            key={benefit.title}
            className="rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-6 hover:border-[#525252] transition-all duration-300 animate-card-stagger"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="mb-4">{benefit.icon}</div>
            <h3 className="text-lg font-semibold text-white mb-1">
              {benefit.title}
            </h3>
            <p className="text-sm font-medium text-[#A855F7] mb-2">
              {benefit.tagline}
            </p>
            <p className="text-sm text-[#A3A3A3] leading-relaxed">
              {benefit.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
