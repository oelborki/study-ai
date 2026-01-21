"use client";

import Link from "next/link";

export function HeroSection() {
  const scrollToDemo = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const demoSection = document.getElementById("demo");
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative mx-auto mt-20 md:mt-28 lg:mt-36 max-w-5xl">
      <div className="relative z-10">
        <h1 className="font-[family-name:var(--font-serif)] text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight text-[#F8FAFC] animate-hero">
          Turn lectures into
          <br />
          <span className="text-[#06B6D4]">study sessions</span>
        </h1>

        <p className="mt-6 md:mt-8 text-lg md:text-xl max-w-xl leading-relaxed animate-hero-delay">
          <span className="inline-block clay-subtle rounded-full px-5 py-2.5 text-[#94A3B8]">
            Upload your documents and let AI create summaries, flashcards, and practice exams. Study smarter, not harder.
          </span>
        </p>

        <div className="mt-10 md:mt-12 flex flex-col sm:flex-row gap-4 animate-hero-delay-2">
          <Link
            href="/register"
            className="btn-clay inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold"
          >
            Get Started
          </Link>
          <a
            href="#demo"
            onClick={scrollToDemo}
            className="btn-clay-dark inline-flex items-center justify-center px-8 py-3.5 text-base font-medium"
          >
            See it in action
            <svg
              className="ml-2 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
