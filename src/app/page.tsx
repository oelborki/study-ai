import { HeroSection } from "@/components/landing/HeroSection";
import { DemoSection } from "@/components/landing/DemoSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { CTASection } from "@/components/landing/CTASection";

export default function Home() {
  return (
    <main className="relative min-h-[calc(100vh-73px)] px-6 py-16 bg-[#0A0A0F] overflow-hidden">
      <HeroSection />
      <DemoSection />
      <FeaturesSection />
      <CTASection />

      <footer className="mx-auto mt-32 md:mt-40 max-w-3xl pb-10">
        <div className="clay-subtle px-8 py-6 text-center">
          <p className="text-xs text-[#64748B]">Study smarter, not harder.</p>
        </div>
      </footer>
    </main>
  );
}
