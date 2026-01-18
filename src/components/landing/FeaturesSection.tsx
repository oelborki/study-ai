"use client";

import { FeatureCard } from "./ui/FeatureCard";
import { DocumentUploadAnimation } from "./animations/DocumentUploadAnimation";
import { SummaryDemoAnimation } from "./animations/SummaryDemoAnimation";
import { FlashcardDemoAnimation } from "./animations/FlashcardDemoAnimation";
import { ExamDemoAnimation } from "./animations/ExamDemoAnimation";
import { ManualDeckAnimation } from "./animations/ManualDeckAnimation";
import { TeamCollabAnimation } from "./animations/TeamCollabAnimation";

const features = [
  {
    title: "Document Upload",
    description: "Upload PDFs and PowerPoints. We extract text and structure automatically.",
    animation: <DocumentUploadAnimation />,
  },
  {
    title: "AI Summaries",
    description: "Get concise bullet-point summaries of key concepts and main ideas.",
    animation: <SummaryDemoAnimation />,
  },
  {
    title: "Flashcards",
    description: "Auto-generated flashcards for active recall and spaced repetition.",
    animation: <FlashcardDemoAnimation />,
  },
  {
    title: "Practice Exams",
    description: "Interactive MCQ exams with instant scoring and explanations.",
    animation: <ExamDemoAnimation />,
  },
  {
    title: "Manual Decks",
    description: "Create custom flashcard decks from scratch for any subject.",
    animation: <ManualDeckAnimation />,
  },
  {
    title: "Team Collaboration",
    description: "Share decks with study groups and collaborate in real-time.",
    animation: <TeamCollabAnimation />,
  },
];

export function FeaturesSection() {
  return (
    <section className="mx-auto mt-32 md:mt-40 lg:mt-48 max-w-6xl px-4">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white">
        Everything you need to study smarter
      </h2>
      <p className="text-center text-[#A3A3A3] mb-12 max-w-2xl mx-auto">
        Powerful features designed to help you learn faster and retain more.
      </p>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, idx) => (
          <FeatureCard
            key={feature.title}
            title={feature.title}
            description={feature.description}
            animation={feature.animation}
            delay={idx * 100}
          />
        ))}
      </div>
    </section>
  );
}
