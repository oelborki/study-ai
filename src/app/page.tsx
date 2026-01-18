import { HeroSection } from "@/components/landing/HeroSection";
import { WhyStudyAISection } from "@/components/landing/WhyStudyAISection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { CTASection } from "@/components/landing/CTASection";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-73px)] px-6 py-16 bg-gradient-to-b from-[#1a0033] via-[#000000] to-[#000000]">
      <HeroSection />
      <WhyStudyAISection />
      <HowItWorksSection />
      <FeaturesSection />
      <CTASection />

      <footer className="mx-auto mt-32 md:mt-40 max-w-3xl pb-10 text-xs text-[#737373] text-center py-12">
        Study smarter, not harder.
      </footer>
    </main>
  );
}
