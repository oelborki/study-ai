"use client";

import { WorkflowAnimation } from "./animations/WorkflowAnimation";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="mx-auto mt-32 md:mt-40 lg:mt-48 max-w-4xl px-4">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white">
        How it works
      </h2>
      <p className="text-center text-[#A3A3A3] mb-12 max-w-2xl mx-auto">
        Watch the magic happen. Upload your materials and let AI transform them into powerful study tools.
      </p>

      <WorkflowAnimation />
    </section>
  );
}
