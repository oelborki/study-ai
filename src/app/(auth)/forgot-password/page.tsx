"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-73px)] flex items-center justify-center px-6 py-12 bg-gradient-to-b from-[#0a1a1f] via-[#000000] to-[#000000]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Reset your password</h1>
          <p className="mt-2 text-[#A3A3A3]">
            {submitted
              ? "Check your email for a reset link"
              : "Enter your email to receive a reset link"}
          </p>
        </div>

        <div className="rounded-xl border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-8">
          {submitted ? (
            <div className="space-y-6">
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">
                If an account with that email exists, we sent a password reset link. Please check your inbox.
              </div>
              <p className="text-center text-sm text-[#737373]">
                Didn&apos;t receive an email?{" "}
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-[#06B6D4] hover:text-[#22D3EE] transition-colors"
                >
                  Try again
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#D4D4D4] mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border-2 border-[#404040] bg-[#121212] px-4 py-3 text-white placeholder-[#737373] focus:border-[#0891B2] focus:outline-none transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-br from-[#0891B2] to-[#06B6D4] px-4 py-3 text-sm font-medium text-white hover:from-[#0E7490] hover:to-[#22D3EE] transition-all disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-[#737373] mt-6">
            Remember your password?{" "}
            <Link href="/login" className="text-[#06B6D4] hover:text-[#22D3EE] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
