import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <nav className="flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-gray-900 hover:text-[#4169E1] transition-colors duration-200"
          >
            Study-AI
          </Link>

          <Link
            href="/upload"
            className="rounded-lg bg-[#4169E1] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#365ECC] transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            Upload Deck
          </Link>
        </nav>
      </div>
    </header>
  );
}
