import Link from "next/link";
import { auth } from "@/auth";
import UserMenu from "@/components/auth/UserMenu";

export default async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 clay-subtle border-b border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <nav className="flex items-center justify-between">
          <Link
            href={session?.user ? "/dashboard" : "/"}
            className="text-2xl font-bold tracking-tight text-white hover:text-accent transition-colors duration-200"
          >
            QuickyNotes
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
                  className="rounded-lg btn-accent px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow-md"
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
                  className="rounded-lg btn-accent px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow-md"
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
