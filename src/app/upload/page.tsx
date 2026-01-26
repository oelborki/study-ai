export default function UploadPage() {
  return (
    <main className="min-h-[calc(100vh-73px)] px-6 py-12 bg-[#000000]">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white tracking-tight">Upload Your Document</h1>
        <p className="mt-3 text-lg text-[#D4D4D4] max-w-3xl">
          Upload a PowerPoint (.pptx) or PDF and generate a summary, flashcards, or a practice exam.
        </p>

        <form
          className="mt-8 flex flex-col gap-4 max-w-xl"
          action="/api/upload"
          method="post"
          encType="multipart/form-data"
        >
        <input
          type="file"
          name="file"
          accept=".pptx,.pdf"
          className="block w-full rounded-lg border border-[#404040] bg-[#0A0A0A] text-white p-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-[#121212] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#D4D4D4] hover:file:bg-[#1A1A1A] transition-colors"
          required
        />

        <button
          type="submit"
          className="rounded-lg bg-gradient-to-br from-[#0891B2] to-[#06B6D4] px-6 py-2.5 text-white hover:from-[#0E7490] hover:to-[#22D3EE] transition-all duration-200 shadow-sm hover:shadow-md font-medium focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:ring-offset-2 focus:ring-offset-black"
        >
          Upload
        </button>

          <p className="text-xs text-[#737373]">
            Tip: Results are cached, so re-clicking modes won&apos;t regenerate.
          </p>
        </form>
      </div>
    </main>
  );
}
