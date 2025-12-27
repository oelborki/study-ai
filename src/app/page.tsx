export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Study-AI</h1>
      <p className="mt-2 text-gray-600">
        Upload a PowerPoint (.pptx) and generate a summary, flashcards, or a practice exam.
      </p>

      <form
        className="mt-6 flex items-center gap-3"
        action="/api/upload"
        method="post"
        encType="multipart/form-data"
      >
        <input
          type="file"
          name="file"
          accept=".pptx"
          className="block w-full max-w-md"
          required
        />
        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-white"
        >
          Upload
        </button>
      </form>
    </main>
  );
}
