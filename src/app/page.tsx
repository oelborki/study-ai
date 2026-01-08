export default function Home() {
  return (
    <main className="min-h-[calc(100vh-73px)] px-6 py-16 bg-gradient-to-b from-[#1a0033] via-[#000000] to-[#000000]">
      <section className="mx-auto mt-16 md:mt-24 lg:mt-32 max-w-4xl text-center">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-white">
          Turn lecture materials into a study session in seconds.
        </h1>
        <p className="mt-6 text-xl md:text-2xl max-w-2xl mx-auto text-[#D4D4D4]">
          Upload your lecture materials (PowerPoint or PDF) and generate a summary, flashcards, and an interactive
          practice exam with scoring. All results are cached for instant access.
        </p>

        <div className="mt-10 md:mt-12 flex justify-center">
          <a
            href="#how-it-works"
            className="rounded-lg border-2 border-[#404040] px-8 py-3 text-[#D4D4D4] hover:border-[#525252] hover:bg-[#1A1A1A] transition-all duration-200"
          >
            How it works
          </a>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto mt-32 md:mt-40 lg:mt-48 max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">How it works</h2>

        <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-3">
          <div className="rounded-lg border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-6 shadow-sm hover:shadow-lg transition-shadow duration-200 animate-card card-step-1">
            <div className="text-xs font-bold uppercase tracking-wide text-[#A855F7]">Step 1</div>
            <div className="mt-2 font-semibold text-lg text-white">Upload a document</div>
            <p className="mt-3 text-sm text-[#A3A3A3] leading-relaxed">
              We extract text and structure from your materials.
            </p>
          </div>

          <div className="rounded-lg border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-6 shadow-sm hover:shadow-lg transition-shadow duration-200 animate-card card-step-2">
            <div className="text-xs font-bold uppercase tracking-wide text-[#A855F7]">Step 2</div>
            <div className="mt-2 font-semibold text-lg text-white">Choose a mode</div>
            <p className="mt-3 text-sm text-[#A3A3A3] leading-relaxed">
              Summary, Flashcards, or Practice Exam.
            </p>
          </div>

          <div className="rounded-lg border border-[#404040] bg-gradient-to-br from-[#121212] to-[#0A0A0A] p-6 shadow-sm hover:shadow-lg transition-shadow duration-200 animate-card card-step-3">
            <div className="text-xs font-bold uppercase tracking-wide text-[#A855F7]">Step 3</div>
            <div className="mt-2 font-semibold text-lg text-white">Study efficiently</div>
            <p className="mt-3 text-sm text-[#A3A3A3] leading-relaxed">
              Interactive exam scoring + retakes, all cached.
            </p>
          </div>
        </div>
      </section>

      <footer className="mx-auto mt-32 md:mt-40 max-w-3xl pb-10 text-xs text-[#737373] text-center py-12">
        Built for single-user MVP. No accounts. Local caching.
      </footer>
    </main>
  );
}
