import Link from "next/link";
import { auth } from "@/auth";
import UserMenu from "@/components/auth/UserMenu";

export default async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-[#404040] bg-[#0A0A0A]">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <nav className="flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-white hover:text-[#A855F7] transition-colors duration-200"
          >
            Study-AI
          </Link>

          <div className="flex items-center gap-4">
            {session?.user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-[#D4D4D4] hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/upload"
                  className="rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-5 py-2.5 text-sm font-medium text-white hover:from-[#581C87] hover:to-[#9333EA] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Upload Deck
                </Link>
                <UserMenu user={session.user} />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-[#D4D4D4] hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-gradient-to-br from-[#6B21A8] to-[#A855F7] px-5 py-2.5 text-sm font-medium text-white hover:from-[#581C87] hover:to-[#9333EA] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
