"use client";

import Link from "next/link";
import { GlowButton } from "./ui/GlowButton";

export function CTASection() {
  return (
    <section className="mx-auto mt-32 md:mt-40 lg:mt-48 max-w-3xl px-4 text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
        Ready to ace your next exam?
      </h2>
      <p className="text-xl text-[#A3A3A3] mb-8">
        Join students studying smarter.
      </p>

      <div className="flex flex-col items-center gap-4">
        <GlowButton href="/register" variant="primary">
          Get Started Free
        </GlowButton>
        <p className="text-sm text-[#737373]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#A855F7] hover:text-[#C084FC] transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </section>
  );
}
