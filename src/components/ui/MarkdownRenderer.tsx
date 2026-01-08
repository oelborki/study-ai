import ReactMarkdown from 'react-markdown';

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-slate max-w-none">
      <ReactMarkdown
        components={{
        // Headings
        h1: ({ node, ...props }) => (
          <h1 className="text-3xl font-bold text-white mt-8 mb-4 first:mt-0" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-2xl font-bold text-white mt-6 mb-3 first:mt-0" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-xl font-semibold text-white mt-5 mb-2 first:mt-0" {...props} />
        ),
        h4: ({ node, ...props }) => (
          <h4 className="text-lg font-semibold text-white mt-4 mb-2 first:mt-0" {...props} />
        ),

        // Paragraphs
        p: ({ node, ...props }) => (
          <p className="text-base leading-7 text-[#D4D4D4] mb-4" {...props} />
        ),

        // Lists
        ul: ({ node, ...props }) => (
          <ul className="list-disc list-outside ml-6 mb-4 space-y-2 text-[#D4D4D4]" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 text-[#D4D4D4]" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="leading-7" {...props} />
        ),

        // Emphasis
        strong: ({ node, ...props }) => (
          <strong className="font-semibold text-white" {...props} />
        ),
        em: ({ node, ...props }) => (
          <em className="italic text-[#D4D4D4]" {...props} />
        ),

        // Code
        code: ({ node, className, children, ...props }) => {
          const inline = !className;
          return inline ? (
            <code className="px-1.5 py-0.5 rounded bg-[#1A1A1A] text-sm font-mono text-[#C084FC]" {...props}>
              {children}
            </code>
          ) : (
            <code className="block px-4 py-3 rounded-lg bg-[#1A1A1A] text-sm font-mono text-[#C084FC] overflow-x-auto mb-4" {...props}>
              {children}
            </code>
          );
        },

        // Blockquotes
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-[#6B21A8] pl-4 italic text-[#D4D4D4] my-4" {...props} />
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
