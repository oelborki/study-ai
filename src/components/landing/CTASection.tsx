"use client";

import Link from "next/link";
import { ScrollReveal } from "./ui/ScrollReveal";

export function CTASection() {
  return (
    <section className="mx-auto mt-32 md:mt-40 max-w-3xl">
      <ScrollReveal>
        {/* Modern clay card */}
        <div className="clay-hero p-8 md:p-12 text-center">
          <h2 className="font-[family-name:var(--font-serif)] text-3xl md:text-4xl text-[#F8FAFC] mb-4">
            Ready to study <span className="text-[#06B6D4]">smarter</span>?
          </h2>
          <p className="text-lg text-[#94A3B8] mb-8 max-w-lg mx-auto">
            Join students who are already learning more efficiently with AI-powered study materials.
          </p>

          <div className="flex flex-col items-center gap-4">
            <Link
              href="/register"
              className="btn-primary-modern inline-flex items-center justify-center px-8 py-3.5 text-base"
            >
              Get Started
            </Link>
            <p className="text-sm text-[#64748B]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#06B6D4] hover:text-[#22D3EE] transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
