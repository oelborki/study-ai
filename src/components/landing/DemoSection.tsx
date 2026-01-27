"use client";

import { ScrollReveal } from "./ui/ScrollReveal";
import { DemoAnimation } from "./DemoAnimation";

export function DemoSection() {
  return (
    <section id="demo" className="mx-auto mt-32 md:mt-40 max-w-5xl scroll-mt-20">
      <ScrollReveal>
        <div className="text-center mb-12">
          <div className="inline-block clay-subtle rounded-full px-6 py-2 mb-6">
            <span className="text-sm font-medium text-[#06B6D4]">Live Demo</span>
          </div>
          <h2 className="font-[family-name:var(--font-serif)] text-3xl md:text-4xl text-[#F8FAFC] mb-4">
            See QuickyNotes in <span className="text-[#06B6D4]">action</span>
          </h2>
          <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
            Upload any document and watch as AI transforms it into comprehensive study materials
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={150}>
        <DemoAnimation />
      </ScrollReveal>
    </section>
  );
}
