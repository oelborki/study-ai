export default function UploadPage() {
  return (
    <main className="min-h-screen p-8">
      <a href="/" className="text-sm underline">← Home</a>

      <h1 className="mt-6 text-3xl md:text-4xl font-bold">Upload a PowerPoint</h1>
      <p className="mt-2 text-gray-600">
        Upload a .pptx and generate a summary, flashcards, or a practice exam.
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
          accept=".pptx"
          className="block w-full rounded-lg border border-gray-300 p-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200 transition-colors"
          required
        />

        <button
          type="submit"
          className="rounded-lg bg-[#4169E1] px-6 py-2.5 text-white hover:bg-[#365ECC] transition-colors duration-200 shadow-sm hover:shadow-md font-medium"
        >
          Upload
        </button>

        <p className="text-xs text-gray-500">
          Tip: Results are cached, so re-clicking modes won’t regenerate.
        </p>
      </form>
    </main>
  );
}
